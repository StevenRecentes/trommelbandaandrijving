const { asNullableNumber, asBit } = require("./catalogusRouteUtils");

function registerCatalogusMotorRoutes({ app, db, ensureDbConfigured, requireAuth, requirePermission }) {
  const motorsGuard = [requireAuth, requirePermission("/gegevens/motors*")];
  const bandenGuard = [requireAuth, requirePermission("/gegevens/banden*")];

  app.get("/api/gegevens/motortypes", ...motorsGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    try {
      const pool = await db.getPool();
      const result = await pool.request().query(`
        SELECT id, leverancier_id, leverancier_naam, code, diameter_nominaal_mm,
               lengte_min_mm, lengte_max_mm, actief
        FROM dbo.vw_motortypes
        ORDER BY leverancier_naam, code
      `);
      res.json(result.recordset || []);
    } catch {
      res.status(500).json({ error: "Failed to load motortypes." });
    }
  });

  app.get("/api/gegevens/motor-leveranciers", ...motorsGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    try {
      const pool = await db.getPool();
      const result = await pool.request().query(`
        SELECT id, naam
        FROM dbo.vw_leveranciers
        WHERE actief = 1
        ORDER BY naam
      `);
      res.json(result.recordset || []);
    } catch {
      res.status(500).json({ error: "Failed to load motor leveranciers." });
    }
  });

  app.post("/api/gegevens/motortypes", ...motorsGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const code = String(req.body?.code || "").trim();
    const leverancierId = Number(req.body?.leverancier_id);
    if (!code || !leverancierId) return res.status(400).json({ error: "Leverancier en code zijn verplicht." });
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("leverancier_id", leverancierId);
      request.input("code", code);
      request.input("diameter_nominaal_mm", asNullableNumber(req.body?.diameter_nominaal_mm));
      request.input("lengte_min_mm", asNullableNumber(req.body?.lengte_min_mm));
      request.input("lengte_max_mm", asNullableNumber(req.body?.lengte_max_mm));
      request.input("actief", asBit(req.body?.actief ?? 1));
      await request.query(`
        INSERT INTO dbo.tbl_motortypes (leverancier_id, code, diameter_nominaal_mm, lengte_min_mm, lengte_max_mm, actief, created_at)
        VALUES (@leverancier_id, @code, @diameter_nominaal_mm, @lengte_min_mm, @lengte_max_mm, @actief, GETDATE())
      `);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to create motortype." });
    }
  });

  app.put("/api/gegevens/motortypes/:id", ...motorsGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const id = Number(req.params.id);
    const code = String(req.body?.code || "").trim();
    const leverancierId = Number(req.body?.leverancier_id);
    if (!id || !code || !leverancierId) {
      return res.status(400).json({ error: "Id, leverancier en code zijn verplicht." });
    }
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("id", id);
      request.input("leverancier_id", leverancierId);
      request.input("code", code);
      request.input("diameter_nominaal_mm", asNullableNumber(req.body?.diameter_nominaal_mm));
      request.input("lengte_min_mm", asNullableNumber(req.body?.lengte_min_mm));
      request.input("lengte_max_mm", asNullableNumber(req.body?.lengte_max_mm));
      request.input("actief", asBit(req.body?.actief ?? 1));
      await request.query(`
        UPDATE dbo.tbl_motortypes
        SET leverancier_id = @leverancier_id,
            code = @code,
            diameter_nominaal_mm = @diameter_nominaal_mm,
            lengte_min_mm = @lengte_min_mm,
            lengte_max_mm = @lengte_max_mm,
            actief = @actief,
            updated_at = GETDATE()
        WHERE id = @id
      `);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to update motortype." });
    }
  });

  app.delete("/api/gegevens/motortypes/:id", ...motorsGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Ongeldig id." });
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("id", id);
      await request.query(`DELETE FROM dbo.tbl_motortypes WHERE id = @id`);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete motortype." });
    }
  });

  app.get("/api/gegevens/motor-specs", ...motorsGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    try {
      const pool = await db.getPool();
      const request = pool.request();
      const filters = [];
      if (req.query?.leverancier_id) {
        request.input("leverancier_id", Number(req.query.leverancier_id));
        filters.push("leverancier_id = @leverancier_id");
      }
      if (req.query?.motortype_id) {
        request.input("motortype_id", Number(req.query.motortype_id));
        filters.push("motortype_id = @motortype_id");
      }
      const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
      const result = await request.query(`
        SELECT id, motortype_id, motortype_code, leverancier_id, leverancier_naam, diameter_nominaal_mm,
               lengte_min_mm, lengte_max_mm, Aansluiting_type_id, Aansluiting_naam,
               vermogen_w, snelheid_ms, polen, force_n, torque_nm, olie_type, actief
        FROM dbo.vw_motor_specs
        ${whereClause}
        ORDER BY leverancier_naam, motortype_code, vermogen_w, snelheid_ms
      `);
      res.json(result.recordset || []);
    } catch {
      res.status(500).json({ error: "Failed to load motor specs." });
    }
  });

  app.get("/api/gegevens/motor-Aansluiting-types", ...motorsGuard, async (req, res) => {
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
      res.status(500).json({ error: "Failed to load motor Aansluiting types." });
    }
  });

  app.post("/api/gegevens/motor-specs", ...motorsGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const motortypeId = Number(req.body?.motortype_id);
    const vermogenW = asNullableNumber(req.body?.vermogen_w);
    const snelheidMs = asNullableNumber(req.body?.snelheid_ms);
    if (!motortypeId || vermogenW === null || snelheidMs === null) {
      return res.status(400).json({ error: "Motortype, vermogen en snelheid zijn verplicht." });
    }
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("motortype_id", motortypeId);
      request.input("vermogen_w", vermogenW);
      request.input("snelheid_ms", snelheidMs);
      request.input("polen", asNullableNumber(req.body?.polen));
      request.input("force_n", asNullableNumber(req.body?.force_n));
      request.input("torque_nm", asNullableNumber(req.body?.torque_nm));
      request.input("Aansluiting_type_id", asNullableNumber(req.body?.Aansluiting_type_id));
      request.input("olie_type", String(req.body?.olie_type || "onbekend").trim() || "onbekend");
      request.input("actief", asBit(req.body?.actief ?? 1));
      await request.query(`
        INSERT INTO dbo.tbl_motor_specs (
          motortype_id, vermogen_w, snelheid_ms, polen, force_n, torque_nm, Aansluiting_type_id, olie_type, actief, created_at
        )
        VALUES (
          @motortype_id, @vermogen_w, @snelheid_ms, @polen, @force_n, @torque_nm, @Aansluiting_type_id, @olie_type, @actief, GETDATE()
        )
      `);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to create motor spec." });
    }
  });

  app.put("/api/gegevens/motor-specs/:id", ...motorsGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const id = Number(req.params.id);
    const motortypeId = Number(req.body?.motortype_id);
    const vermogenW = asNullableNumber(req.body?.vermogen_w);
    const snelheidMs = asNullableNumber(req.body?.snelheid_ms);
    if (!id || !motortypeId || vermogenW === null || snelheidMs === null) {
      return res.status(400).json({ error: "Id, motortype, vermogen en snelheid zijn verplicht." });
    }
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("id", id);
      request.input("motortype_id", motortypeId);
      request.input("vermogen_w", vermogenW);
      request.input("snelheid_ms", snelheidMs);
      request.input("polen", asNullableNumber(req.body?.polen));
      request.input("force_n", asNullableNumber(req.body?.force_n));
      request.input("torque_nm", asNullableNumber(req.body?.torque_nm));
      request.input("Aansluiting_type_id", asNullableNumber(req.body?.Aansluiting_type_id));
      request.input("olie_type", String(req.body?.olie_type || "onbekend").trim() || "onbekend");
      request.input("actief", asBit(req.body?.actief ?? 1));
      await request.query(`
        UPDATE dbo.tbl_motor_specs
        SET motortype_id = @motortype_id,
            vermogen_w = @vermogen_w,
            snelheid_ms = @snelheid_ms,
            polen = @polen,
            force_n = @force_n,
            torque_nm = @torque_nm,
            Aansluiting_type_id = @Aansluiting_type_id,
            olie_type = @olie_type,
            actief = @actief,
            updated_at = GETDATE()
        WHERE id = @id
      `);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to update motor spec." });
    }
  });

  app.delete("/api/gegevens/motor-specs/:id", ...motorsGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Ongeldig id." });
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("id", id);
      await request.query(`DELETE FROM dbo.tbl_motor_specs WHERE id = @id`);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete motor spec." });
    }
  });

  app.get("/api/gegevens/band-compat", ...bandenGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    try {
      const pool = await db.getPool();
      const result = await pool.request().query(`
        SELECT id, band_type_id, band_type_naam, uitvoering_type_id, uitvoering_naam, motortype_id, motortype_code,
               leverancier_id, leverancier_naam, tandenaantal, pcd_mm, actief
        FROM dbo.vw_band_motor_compatibiliteit
        ORDER BY band_type_naam, uitvoering_naam, leverancier_naam, motortype_code
      `);
      res.json(result.recordset || []);
    } catch {
      res.status(500).json({ error: "Failed to load compatibiliteit." });
    }
  });

  app.post("/api/gegevens/band-compat", ...bandenGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const bandTypeId = Number(req.body?.band_type_id);
    const uitvoeringTypeId = Number(req.body?.uitvoering_type_id);
    const motortypeId = Number(req.body?.motortype_id);
    if (!bandTypeId || !uitvoeringTypeId || !motortypeId) {
      return res.status(400).json({ error: "Band, uitvoering en motortype zijn verplicht." });
    }
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("band_type_id", bandTypeId);
      request.input("uitvoering_type_id", uitvoeringTypeId);
      request.input("motortype_id", motortypeId);
      request.input("tandenaantal", asNullableNumber(req.body?.tandenaantal));
      request.input("pcd_mm", asNullableNumber(req.body?.pcd_mm));
      request.input("actief", asBit(req.body?.actief ?? 1));
      await request.query(`
        INSERT INTO dbo.tbl_band_motor_compatibiliteit (
          band_type_id, uitvoering_type_id, motortype_id, tandenaantal, pcd_mm, actief, created_at
        )
        VALUES (
          @band_type_id, @uitvoering_type_id, @motortype_id, @tandenaantal, @pcd_mm, @actief, GETDATE()
        )
      `);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to create compatibiliteit." });
    }
  });

  app.put("/api/gegevens/band-compat/:id", ...bandenGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const id = Number(req.params.id);
    const bandTypeId = Number(req.body?.band_type_id);
    const uitvoeringTypeId = Number(req.body?.uitvoering_type_id);
    const motortypeId = Number(req.body?.motortype_id);
    if (!id || !bandTypeId || !uitvoeringTypeId || !motortypeId) {
      return res.status(400).json({ error: "Id, band, uitvoering en motortype zijn verplicht." });
    }
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("id", id);
      request.input("band_type_id", bandTypeId);
      request.input("uitvoering_type_id", uitvoeringTypeId);
      request.input("motortype_id", motortypeId);
      request.input("tandenaantal", asNullableNumber(req.body?.tandenaantal));
      request.input("pcd_mm", asNullableNumber(req.body?.pcd_mm));
      request.input("actief", asBit(req.body?.actief ?? 1));
      await request.query(`
        UPDATE dbo.tbl_band_motor_compatibiliteit
        SET band_type_id = @band_type_id,
            uitvoering_type_id = @uitvoering_type_id,
            motortype_id = @motortype_id,
            tandenaantal = @tandenaantal,
            pcd_mm = @pcd_mm,
            actief = @actief,
            updated_at = GETDATE()
        WHERE id = @id
      `);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to update compatibiliteit." });
    }
  });

  app.delete("/api/gegevens/band-compat/:id", ...bandenGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Ongeldig id." });
    try {
      const pool = await db.getPool();
      const request = pool.request();
      request.input("id", id);
      await request.query(`DELETE FROM dbo.tbl_band_motor_compatibiliteit WHERE id = @id`);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete compatibiliteit." });
    }
  });
}

module.exports = { registerCatalogusMotorRoutes };
