const { asNullableNumber, asBit } = require("./catalogusRouteUtils");

function hasAtMostDecimals(rawValue, maxDecimals) {
  if (rawValue === null || rawValue === undefined) return true;
  const normalized = String(rawValue).trim().replace(",", ".");
  if (!normalized) return true;
  const [, decimals = ""] = normalized.split(".");
  return decimals.length <= maxDecimals;
}

function validateWrijvingsfactor(rawValue, numericValue) {
  if (rawValue === null || rawValue === undefined || String(rawValue).trim() === "") return null;
  if (numericValue === null) return "Wrijvingsfactor is ongeldig.";
  if (!hasAtMostDecimals(rawValue, 2)) return "Wrijvingsfactor mag maximaal 2 decimalen hebben.";
  if (numericValue < 0 || numericValue > 1) return "Wrijvingsfactor moet tussen 0 en 1 liggen.";
  return null;
}

function parseWrijvingsfactorPair(body) {
  const droogRaw = body?.wrijvingsfactor ?? body?.wrijvingscoeff_rvs_droog;
  const natRaw = body?.wrijvingscoeff_rvs_nat ?? droogRaw;
  const droogValue = asNullableNumber(droogRaw);
  const natValue = asNullableNumber(natRaw);
  const droogError = validateWrijvingsfactor(droogRaw, droogValue);
  if (droogError) return { error: droogError };
  const natError = validateWrijvingsfactor(natRaw, natValue);
  if (natError) return { error: natError };
  return { droogValue, natValue, error: null };
}

function registerCatalogusCoreRoutes({ app, db, ensureDbConfigured, requireAuth, requirePermission }) {
  const leveranciersGuard = [requireAuth, requirePermission("/gegevens/leveranciers*")];
  const bandenGuard = [requireAuth, requirePermission("/gegevens/banden*")];

  app.get("/api/gegevens/leveranciers", ...leveranciersGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    try {
      const pool = await db.getPool();
      const result = await pool.request().query(`
        SELECT id, naam, actief, created_at, updated_at
        FROM dbo.vw_leveranciers
        ORDER BY naam
      `);
      res.json(result.recordset || []);
    } catch {
      res.status(500).json({ error: "Failed to load leveranciers." });
    }
  });

  app.post("/api/gegevens/leveranciers", ...leveranciersGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const naam = String(req.body?.naam || "").trim();
    if (!naam) return res.status(400).json({ error: "Naam is verplicht." });
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("naam", naam);
      request.input("actief", asBit(req.body?.actief ?? 1));
      await request.query(`
        INSERT INTO dbo.tbl_leveranciers (naam, actief, created_at)
        VALUES (@naam, @actief, GETDATE())
      `);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to create leverancier." });
    }
  });

  app.put("/api/gegevens/leveranciers/:id", ...leveranciersGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const id = Number(req.params.id);
    const naam = String(req.body?.naam || "").trim();
    if (!id || !naam) return res.status(400).json({ error: "Id en naam zijn verplicht." });
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("id", id);
      request.input("naam", naam);
      request.input("actief", asBit(req.body?.actief ?? 1));
      await request.query(`
        UPDATE dbo.tbl_leveranciers
        SET naam = @naam, actief = @actief, updated_at = GETDATE()
        WHERE id = @id
      `);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to update leverancier." });
    }
  });

  app.delete("/api/gegevens/leveranciers/:id", ...leveranciersGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Ongeldig id." });
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("id", id);
      await request.query(`DELETE FROM dbo.tbl_leveranciers WHERE id = @id`);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete leverancier." });
    }
  });

  app.get("/api/gegevens/uitvoering-types", ...leveranciersGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    try {
      const pool = await db.getPool();
      const result = await pool.request().query(`
        SELECT id, naam, code, actief, created_at, updated_at
        FROM dbo.vw_uitvoering_types
        ORDER BY naam
      `);
      res.json(result.recordset || []);
    } catch {
      res.status(500).json({ error: "Failed to load uitvoering types." });
    }
  });

  app.post("/api/gegevens/uitvoering-types", ...leveranciersGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const naam = String(req.body?.naam || "").trim();
    if (!naam) return res.status(400).json({ error: "Naam is verplicht." });
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("naam", naam);
      request.input("code", String(req.body?.code || "").trim() || null);
      request.input("actief", asBit(req.body?.actief ?? 1));
      await request.query(`
        INSERT INTO dbo.tbl_uitvoering_types (naam, code, actief, created_at)
        VALUES (@naam, @code, @actief, GETDATE())
      `);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to create uitvoering type." });
    }
  });

  app.put("/api/gegevens/uitvoering-types/:id", ...leveranciersGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const id = Number(req.params.id);
    const naam = String(req.body?.naam || "").trim();
    if (!id || !naam) return res.status(400).json({ error: "Id en naam zijn verplicht." });
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("id", id);
      request.input("naam", naam);
      request.input("code", String(req.body?.code || "").trim() || null);
      request.input("actief", asBit(req.body?.actief ?? 1));
      await request.query(`
        UPDATE dbo.tbl_uitvoering_types
        SET naam = @naam, code = @code, actief = @actief, updated_at = GETDATE()
        WHERE id = @id
      `);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to update uitvoering type." });
    }
  });

  app.delete("/api/gegevens/uitvoering-types/:id", ...leveranciersGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Ongeldig id." });
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("id", id);
      await request.query(`DELETE FROM dbo.tbl_uitvoering_types WHERE id = @id`);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete uitvoering type." });
    }
  });

  app.get("/api/gegevens/Aansluiting-types", ...leveranciersGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    try {
      const pool = await db.getPool();
      const result = await pool.request().query(`
        SELECT id, naam, code, actief, created_at, updated_at
        FROM dbo.vw_Aansluiting_types
        ORDER BY naam
      `);
      res.json(result.recordset || []);
    } catch {
      res.status(500).json({ error: "Failed to load Aansluiting types." });
    }
  });

  app.post("/api/gegevens/Aansluiting-types", ...leveranciersGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const naam = String(req.body?.naam || "").trim();
    if (!naam) return res.status(400).json({ error: "Naam is verplicht." });
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("naam", naam);
      request.input("code", String(req.body?.code || "").trim() || null);
      request.input("actief", asBit(req.body?.actief ?? 1));
      await request.query(`
        INSERT INTO dbo.tbl_Aansluiting_types (naam, code, actief, created_at)
        VALUES (@naam, @code, @actief, GETDATE())
      `);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to create Aansluiting type." });
    }
  });

  app.put("/api/gegevens/Aansluiting-types/:id", ...leveranciersGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const id = Number(req.params.id);
    const naam = String(req.body?.naam || "").trim();
    if (!id || !naam) return res.status(400).json({ error: "Id en naam zijn verplicht." });
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("id", id);
      request.input("naam", naam);
      request.input("code", String(req.body?.code || "").trim() || null);
      request.input("actief", asBit(req.body?.actief ?? 1));
      await request.query(`
        UPDATE dbo.tbl_Aansluiting_types
        SET naam = @naam, code = @code, actief = @actief, updated_at = GETDATE()
        WHERE id = @id
      `);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to update Aansluiting type." });
    }
  });

  app.delete("/api/gegevens/Aansluiting-types/:id", ...leveranciersGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Ongeldig id." });
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("id", id);
      await request.query(`DELETE FROM dbo.tbl_Aansluiting_types WHERE id = @id`);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete Aansluiting type." });
    }
  });

  app.get("/api/gegevens/band-types", ...bandenGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    try {
      const pool = await db.getPool();
      const result = await pool.request().query(`
        SELECT id, naam, steek_mm, dikte_tand_mm, dikte_band_mm, wrijvingscoeff_rvs_droog, wrijvingscoeff_rvs_nat, actief
        FROM dbo.vw_band_types
        ORDER BY naam
      `);
      res.json(result.recordset || []);
    } catch {
      res.status(500).json({ error: "Failed to load band types." });
    }
  });

  app.post("/api/gegevens/band-types", ...bandenGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const naam = String(req.body?.naam || "").trim();
    if (!naam) return res.status(400).json({ error: "Naam is verplicht." });
    const { droogValue, natValue, error } = parseWrijvingsfactorPair(req.body);
    if (error) return res.status(400).json({ error });
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("naam", naam);
      request.input("steek_mm", asNullableNumber(req.body?.steek_mm));
      request.input("dikte_tand_mm", asNullableNumber(req.body?.dikte_tand_mm));
      request.input("dikte_band_mm", asNullableNumber(req.body?.dikte_band_mm));
      request.input("wrijvingscoeff_rvs_droog", droogValue);
      request.input("wrijvingscoeff_rvs_nat", natValue);
      request.input("actief", asBit(req.body?.actief ?? 1));
      await request.query(`
        INSERT INTO dbo.tbl_band_types (
          naam, steek_mm, dikte_tand_mm, dikte_band_mm, wrijvingscoeff_rvs_droog, wrijvingscoeff_rvs_nat, actief, created_at
        )
        VALUES (
          @naam, @steek_mm, @dikte_tand_mm, @dikte_band_mm, @wrijvingscoeff_rvs_droog, @wrijvingscoeff_rvs_nat, @actief, GETDATE()
        )
      `);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to create band type." });
    }
  });

  app.put("/api/gegevens/band-types/:id", ...bandenGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const id = Number(req.params.id);
    const naam = String(req.body?.naam || "").trim();
    if (!id || !naam) return res.status(400).json({ error: "Id en naam zijn verplicht." });
    const { droogValue, natValue, error } = parseWrijvingsfactorPair(req.body);
    if (error) return res.status(400).json({ error });
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("id", id);
      request.input("naam", naam);
      request.input("steek_mm", asNullableNumber(req.body?.steek_mm));
      request.input("dikte_tand_mm", asNullableNumber(req.body?.dikte_tand_mm));
      request.input("dikte_band_mm", asNullableNumber(req.body?.dikte_band_mm));
      request.input("wrijvingscoeff_rvs_droog", droogValue);
      request.input("wrijvingscoeff_rvs_nat", natValue);
      request.input("actief", asBit(req.body?.actief ?? 1));
      await request.query(`
        UPDATE dbo.tbl_band_types
        SET naam = @naam,
            steek_mm = @steek_mm,
            dikte_tand_mm = @dikte_tand_mm,
            dikte_band_mm = @dikte_band_mm,
            wrijvingscoeff_rvs_droog = @wrijvingscoeff_rvs_droog,
            wrijvingscoeff_rvs_nat = @wrijvingscoeff_rvs_nat,
            actief = @actief,
            updated_at = GETDATE()
        WHERE id = @id
      `);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to update band type." });
    }
  });

  app.delete("/api/gegevens/band-types/:id", ...bandenGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Ongeldig id." });
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("id", id);
      await request.query(`DELETE FROM dbo.tbl_band_types WHERE id = @id`);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete band type." });
    }
  });
}

module.exports = { registerCatalogusCoreRoutes };
