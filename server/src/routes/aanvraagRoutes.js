const { selectMotorCandidates } = require("../services/selectieEngine");
const { generateAanvraagPdf } = require("../services/aanvraagPdfService");
const { sendAanvraagEmails } = require("../services/aanvraagMailService");

function asNullableNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function asIsoTimestamp(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function buildSelectieInputFromBody(body) {
  return {
    bandTypeId: asNullableNumber(body?.band_type_id),
    uitvoeringTypeId: asNullableNumber(body?.uitvoering_type_id),
    AansluitingTypeId: asNullableNumber(body?.Aansluiting_type_id),
    vermogenW: asNullableNumber(body?.invoer_vermogen_w),
    snelheidMs: asNullableNumber(body?.invoer_snelheid_ms),
    olieVoorkeur: String(body?.olie_voorkeur || "").trim() || null,
    soortTransporteur: String(body?.soort_transporteur || "").trim() || null,
    opvoerhoekGraden: asNullableNumber(body?.opvoerhoek_graden),
    opvoerhoogteM: asNullableNumber(body?.opvoerhoogte_m),
    trommellengteMm: asNullableNumber(body?.trommellengte_mm),
  };
}

async function ensureKlantForUser(db, user) {
  const pool = await db.getPool();
  const normalizedEmail = String(user?.email || "").trim().toLowerCase();
  const fullName = `${String(user?.voornaam || "").trim()} ${String(user?.achternaam || "").trim()}`.trim();
  const check = pool.request();
  check.input("user_id", user.user_id);
  check.input("email", normalizedEmail);
  const existing = await check.query(`
    SELECT TOP 1 id
    FROM dbo.vw_klanten
    WHERE user_id = @user_id OR LOWER(email) = @email
    ORDER BY id
  `);
  if (existing.recordset[0]?.id) return Number(existing.recordset[0].id);

  const insert = pool.request();
  insert.input("user_id", user.user_id);
  insert.input("email", normalizedEmail);
  insert.input("contactpersoon_naam", fullName || user.username || normalizedEmail);
  insert.input("bedrijfsnaam", null);
  const created = await insert.query(`
    INSERT INTO dbo.tbl_klanten (user_id, email, contactpersoon_naam, bedrijfsnaam, actief, created_at)
    OUTPUT INSERTED.id
    VALUES (@user_id, @email, @contactpersoon_naam, @bedrijfsnaam, 1, GETDATE())
  `);
  return Number(created.recordset[0]?.id);
}

async function loadAanvraagDetail(pool, aanvraagId) {
  const aanvraagReq = pool.request();
  aanvraagReq.input("id", aanvraagId);
  const aanvraagResult = await aanvraagReq.query(`
    SELECT *
    FROM dbo.vw_aanvragen_backoffice
    WHERE id = @id
  `);
  const aanvraag = aanvraagResult.recordset[0];
  if (!aanvraag) return null;

  const regelsReq = pool.request();
  regelsReq.input("aanvraag_id", aanvraagId);
  const regelsResult = await regelsReq.query(`
    SELECT id, aanvraag_id, motor_spec_id, netto_snelheid_ms, ranking_score,
           is_geselecteerd, volgorde, motortype_code, leverancier_naam,
           vermogen_w, snelheid_ms, olie_type
    FROM dbo.vw_aanvraag_resultaten
    WHERE aanvraag_id = @aanvraag_id
    ORDER BY volgorde, ranking_score DESC, id
  `);

  return { ...aanvraag, regels: regelsResult.recordset || [] };
}

async function hasKlantStatusSeenColumn(pool) {
  const result = await pool
    .request()
    .query("SELECT CASE WHEN COL_LENGTH('dbo.tbl_klanten', 'laatste_status_gezien_op') IS NULL THEN 0 ELSE 1 END AS has_column");
  return Number(result.recordset?.[0]?.has_column || 0) === 1;
}

function registerAanvraagRoutes({ app, db, ensureDbConfigured, requireAuth, requirePermission }) {
  const backofficeGuard = [requireAuth, requirePermission("/aanvragen*")];
  const klantGuard = [requireAuth, requirePermission("/klantenportaal/aanvragen*")];

  app.get("/api/aanvragen", ...backofficeGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    try {
      const pool = await db.getPool();
      const result = await pool.request().query(`
        SELECT id, status, project_naam, bedrijfsnaam, contactpersoon_naam, klant_email,
               band_type_naam, uitvoering_naam, Aansluiting_naam, invoer_vermogen_w,
               invoer_snelheid_ms, olie_voorkeur, soort_transporteur, opvoerhoek_graden,
               opvoerhoogte_m, trommellengte_mm, aangemaakt_op, bijgewerkt_op
        FROM dbo.vw_aanvragen_backoffice
        ORDER BY aangemaakt_op DESC, id DESC
      `);
      res.json(result.recordset || []);
    } catch {
      res.status(500).json({ error: "Failed to load aanvragen." });
    }
  });

  app.get("/api/aanvragen/:id", ...backofficeGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Ongeldig id." });
    try {
      const pool = await db.getPool();
      const detail = await loadAanvraagDetail(pool, id);
      if (!detail) return res.status(404).json({ error: "Aanvraag niet gevonden." });
      res.json(detail);
    } catch {
      res.status(500).json({ error: "Failed to load aanvraag detail." });
    }
  });

  app.put("/api/aanvragen/:id/status", ...backofficeGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const id = Number(req.params.id);
    const status = String(req.body?.status || "").trim();
    if (!id || !status) return res.status(400).json({ error: "Id en status zijn verplicht." });
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("id", id);
      request.input("status", status);
      await request.query(`
        UPDATE dbo.tbl_aanvragen
        SET status = @status, bijgewerkt_op = GETDATE()
        WHERE id = @id
      `);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to update aanvraag status." });
    }
  });

  app.get("/api/klantenportaal/aanvragen", ...klantGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    try {
      const klantId = await ensureKlantForUser(db, req.user);
      const pool = await db.getPool();
      const request = pool.request();
      request.input("klant_id", klantId);
      const result = await request.query(`
        SELECT id, status, project_naam, band_type_naam, uitvoering_naam, Aansluiting_naam,
               invoer_vermogen_w, invoer_snelheid_ms, olie_voorkeur, soort_transporteur,
               opvoerhoek_graden, opvoerhoogte_m, trommellengte_mm, aangemaakt_op, bijgewerkt_op
        FROM dbo.vw_aanvragen_klant
        WHERE klant_id = @klant_id
        ORDER BY aangemaakt_op DESC, id DESC
      `);
      res.json(result.recordset || []);
    } catch {
      res.status(500).json({ error: "Failed to load klant aanvragen." });
    }
  });

  app.get("/api/klantenportaal/meta/band-types", ...klantGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    try {
      const pool = await db.getPool();
      const result = await pool.request().query(`
        SELECT id, naam
        FROM dbo.vw_band_types
        WHERE actief = 1
        ORDER BY naam
      `);
      res.json(result.recordset || []);
    } catch {
      res.status(500).json({ error: "Failed to load band types." });
    }
  });

  app.get("/api/klantenportaal/meta/uitvoering-types", ...klantGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    try {
      const pool = await db.getPool();
      const result = await pool.request().query(`
        SELECT id, naam
        FROM dbo.vw_uitvoering_types
        WHERE actief = 1
        ORDER BY naam
      `);
      res.json(result.recordset || []);
    } catch {
      res.status(500).json({ error: "Failed to load uitvoering types." });
    }
  });

  app.get("/api/klantenportaal/meta/Aansluiting-types", ...klantGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    try {
      const pool = await db.getPool();
      const result = await pool.request().query(`
        SELECT id, naam
        FROM dbo.vw_Aansluiting_types
        WHERE actief = 1
        ORDER BY naam
      `);
      res.json(result.recordset || []);
    } catch {
      res.status(500).json({ error: "Failed to load Aansluiting types." });
    }
  });

  app.get("/api/klantenportaal/aanvragen/overzicht", ...klantGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    try {
      const klantId = await ensureKlantForUser(db, req.user);
      const pool = await db.getPool();
      const supportsSeenTracking = await hasKlantStatusSeenColumn(pool);

      const listReq = pool.request();
      listReq.input("klant_id", klantId);
      const listResult = await listReq.query(`
        SELECT TOP 200
          id, status, project_naam, band_type_naam, uitvoering_naam, Aansluiting_naam,
          invoer_vermogen_w, invoer_snelheid_ms, olie_voorkeur, soort_transporteur,
          opvoerhoek_graden, opvoerhoogte_m, trommellengte_mm, aangemaakt_op, bijgewerkt_op
        FROM dbo.vw_aanvragen_klant
        WHERE klant_id = @klant_id
        ORDER BY aangemaakt_op DESC, id DESC
      `);
      const rows = listResult.recordset || [];
      const latestFive = rows.slice(0, 5);
      const activeRows = rows.filter((item) => !["definitief", "afgerond", "afgewezen", "gesloten"].includes(String(item.status || "").toLowerCase()));

      let lastSeenAt = null;
      let unseenStatusCount = 0;
      if (supportsSeenTracking) {
        const seenReq = pool.request();
        seenReq.input("klant_id", klantId);
        const seenResult = await seenReq.query(`
          SELECT TOP 1 laatste_status_gezien_op
          FROM dbo.vw_klanten
          WHERE id = @klant_id
        `);
        lastSeenAt = seenResult.recordset?.[0]?.laatste_status_gezien_op || null;
        const threshold = lastSeenAt ? new Date(lastSeenAt).getTime() : 0;
        unseenStatusCount = rows.filter((item) => {
          const stamp = item?.bijgewerkt_op || item?.aangemaakt_op;
          if (!stamp) return false;
          const time = new Date(stamp).getTime();
          return Number.isFinite(time) && time > threshold;
        }).length;
      }

      res.json({
        totals: {
          totaal: rows.length,
          lopend: activeRows.length,
          afgerond: rows.length - activeRows.length,
          ongelezen_status_updates: unseenStatusCount,
        },
        laatste: latestFive,
        lopende: activeRows.slice(0, 10),
        status_tracking: {
          enabled: supportsSeenTracking,
          laatste_status_gezien_op: asIsoTimestamp(lastSeenAt),
        },
      });
    } catch {
      res.status(500).json({ error: "Failed to load klantenportaal overzicht." });
    }
  });

  app.post("/api/klantenportaal/aanvragen/status-updates/seen", ...klantGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    try {
      const klantId = await ensureKlantForUser(db, req.user);
      const pool = await db.getPool();
      const supportsSeenTracking = await hasKlantStatusSeenColumn(pool);
      if (!supportsSeenTracking) {
        return res.json({ success: true, tracking_enabled: false });
      }

      const request = pool.request();
      request.input("klant_id", klantId);
      await request.query(`
        UPDATE dbo.tbl_klanten
        SET laatste_status_gezien_op = GETDATE(),
            updated_at = GETDATE()
        WHERE id = @klant_id
      `);
      res.json({ success: true, tracking_enabled: true, marked_at: new Date().toISOString() });
    } catch {
      res.status(500).json({ error: "Failed to mark status updates as seen." });
    }
  });

  app.post("/api/klantenportaal/aanvragen", ...klantGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    try {
      const klantId = await ensureKlantForUser(db, req.user);
      const pool = await db.getPool();
      const request = pool.request();
      request.input("klant_id", klantId);
      request.input("band_type_id", asNullableNumber(req.body?.band_type_id));
      request.input("uitvoering_type_id", asNullableNumber(req.body?.uitvoering_type_id));
      request.input("Aansluiting_type_id", asNullableNumber(req.body?.Aansluiting_type_id));
      request.input("invoer_vermogen_w", asNullableNumber(req.body?.invoer_vermogen_w));
      request.input("invoer_snelheid_ms", asNullableNumber(req.body?.invoer_snelheid_ms));
      request.input("olie_voorkeur", String(req.body?.olie_voorkeur || "").trim() || null);
      request.input("soort_transporteur", String(req.body?.soort_transporteur || "").trim() || null);
      request.input("opvoerhoek_graden", asNullableNumber(req.body?.opvoerhoek_graden));
      request.input("opvoerhoogte_m", asNullableNumber(req.body?.opvoerhoogte_m));
      request.input("trommellengte_mm", asNullableNumber(req.body?.trommellengte_mm));
      request.input("project_naam", String(req.body?.project_naam || "").trim() || null);
      request.input("opmerkingen", String(req.body?.opmerkingen || "").trim() || null);

      const created = await request.query(`
        INSERT INTO dbo.tbl_aanvragen (
          klant_id, band_type_id, uitvoering_type_id, Aansluiting_type_id, invoer_vermogen_w,
          invoer_snelheid_ms, olie_voorkeur, soort_transporteur, opvoerhoek_graden,
          opvoerhoogte_m, trommellengte_mm, status, project_naam, opmerkingen, aangemaakt_op
        )
        OUTPUT INSERTED.id
        VALUES (
          @klant_id, @band_type_id, @uitvoering_type_id, @Aansluiting_type_id, @invoer_vermogen_w,
          @invoer_snelheid_ms, @olie_voorkeur, @soort_transporteur, @opvoerhoek_graden,
          @opvoerhoogte_m, @trommellengte_mm, 'ingediend', @project_naam, @opmerkingen, GETDATE()
        )
      `);

      const aanvraagId = Number(created.recordset[0]?.id);
      const kandidaten = await selectMotorCandidates({ db, ...buildSelectieInputFromBody(req.body) });

      for (const kandidaat of kandidaten) {
        const insertRegel = pool.request();
        insertRegel.input("aanvraag_id", aanvraagId);
        insertRegel.input("motor_spec_id", kandidaat.motor_spec_id);
        insertRegel.input("netto_snelheid_ms", kandidaat.netto_snelheid_ms ?? kandidaat.snelheid_ms);
        insertRegel.input("ranking_score", kandidaat.ranking_score);
        insertRegel.input("is_geselecteerd", kandidaat.volgorde === 1 ? 1 : 0);
        insertRegel.input("volgorde", kandidaat.volgorde);
        await insertRegel.query(`
          INSERT INTO dbo.tbl_aanvraag_resultaten (
            aanvraag_id, motor_spec_id, netto_snelheid_ms, ranking_score, is_geselecteerd, volgorde, created_at
          )
          VALUES (
            @aanvraag_id, @motor_spec_id, @netto_snelheid_ms, @ranking_score, @is_geselecteerd, @volgorde, GETDATE()
          )
        `);
      }

      res.json({ success: true, id: aanvraagId, resultaten: kandidaten });
    } catch {
      res.status(500).json({ error: "Failed to create aanvraag." });
    }
  });

  app.post("/api/klantenportaal/aanvragen/preview", ...klantGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    try {
      const selectieInput = buildSelectieInputFromBody(req.body);
      if (!selectieInput.bandTypeId || !selectieInput.uitvoeringTypeId) {
        return res.json({ success: true, resultaten: [] });
      }
      const kandidaten = await selectMotorCandidates({ db, ...selectieInput });
      res.json({ success: true, resultaten: kandidaten });
    } catch {
      res.status(500).json({ error: "Failed to preview aanvraag." });
    }
  });

  app.post("/api/klantenportaal/aanvragen/:id/definitief", ...klantGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Ongeldig id." });
    try {
      const klantId = await ensureKlantForUser(db, req.user);
      const pool = await db.getPool();

      const ownershipReq = pool.request();
      ownershipReq.input("id", id);
      ownershipReq.input("klant_id", klantId);
      const ownershipResult = await ownershipReq.query(`
        SELECT TOP 1 id
        FROM dbo.vw_aanvragen_klant
        WHERE id = @id AND klant_id = @klant_id
      `);
      if (!ownershipResult.recordset[0]?.id) {
        return res.status(404).json({ error: "Aanvraag niet gevonden." });
      }

      const detail = await loadAanvraagDetail(pool, id);
      if (!detail) return res.status(404).json({ error: "Aanvraag niet gevonden." });

      const pdf = await generateAanvraagPdf({ aanvraag: detail, regels: detail.regels || [] });
      const mail = await sendAanvraagEmails({ aanvraag: detail, pdfPath: pdf.absolutePath });

      const updateReq = pool.request();
      updateReq.input("id", id);
      updateReq.input("klant_id", klantId);
      updateReq.input("pdf_pad", pdf.absolutePath);
      await updateReq.query(`
        UPDATE dbo.tbl_aanvragen
        SET status = 'definitief',
            pdf_pad = @pdf_pad,
            bijgewerkt_op = GETDATE()
        WHERE id = @id AND klant_id = @klant_id
      `);

      res.json({ success: true, pdf: pdf.filename, mail });
    } catch {
      res.status(500).json({ error: "Failed to finalize aanvraag." });
    }
  });
}

module.exports = { registerAanvraagRoutes };
