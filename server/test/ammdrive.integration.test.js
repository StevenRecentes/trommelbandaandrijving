const test = require("node:test");
const assert = require("node:assert/strict");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const path = require("node:path");

const db = require("../src/db");
const { selectMotorCandidates } = require("../src/services/selectieEngine");

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

async function queryOne(sqlText, params = {}) {
  const pool = await db.getPool();
  const request = pool.request();
  Object.entries(params).forEach(([key, value]) => request.input(key, value));
  const result = await request.query(sqlText);
  return result.recordset[0] || null;
}

test("ammdrive import dry-run produces expected core counts", async () => {
  const script = path.resolve(PROJECT_ROOT, "scripts", "import_ammdrive.py");
  const workbook = path.resolve(PROJECT_ROOT, "Project_uiteenzetting", "Ammdrive overzicht en berekening.xlsx");
  const { stdout } = await execFileAsync("python", [script, "--file", workbook, "--dry-run"], {
    cwd: PROJECT_ROOT,
  });
  const lines = stdout
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean);
  const payload = JSON.parse(lines[lines.length - 1]);
  assert.equal(payload.dry_run, true);
  assert.ok(payload.motor_specs > 200);
  assert.ok(payload.compatibiliteit > 100);
});

test("selection on imported dataset is deterministic for demo usecase", async () => {
  const band = await queryOne("SELECT TOP 1 id FROM dbo.vw_band_types WHERE naam = @naam", {
    naam: "Soliflex Pro mini 2,0",
  });
  const uitvoering = await queryOne("SELECT TOP 1 id FROM dbo.vw_uitvoering_types WHERE code = @code", {
    code: "sprocket",
  });

  assert.ok(band?.id, "Band id not found");
  assert.ok(uitvoering?.id, "Uitvoering id not found");

  const input = {
    db,
    bandTypeId: Number(band.id),
    uitvoeringTypeId: Number(uitvoering.id),
    vermogenW: 300,
    snelheidMs: 0.65,
    olieVoorkeur: null,
    tolerancePct: 0.1,
  };
  const firstRun = await selectMotorCandidates(input);
  const secondRun = await selectMotorCandidates(input);

  assert.ok(firstRun.length > 0, "No candidates found for demo usecase");
  assert.equal(firstRun[0].motor_spec_id, secondRun[0].motor_spec_id);
  assert.equal(firstRun[0].motortype_code, secondRun[0].motortype_code);
  assert.ok(Math.abs(Number(firstRun[0].netto_snelheid_ms) - 0.65) <= 0.1);
});

test("core catalog datasets are non-empty after import", async () => {
  const row = await queryOne(`
    SELECT
      (SELECT COUNT(*) FROM dbo.vw_leveranciers) AS leveranciers,
      (SELECT COUNT(*) FROM dbo.vw_motortypes) AS motortypes,
      (SELECT COUNT(*) FROM dbo.vw_motor_specs) AS motor_specs,
      (SELECT COUNT(*) FROM dbo.vw_band_types) AS band_types,
      (SELECT COUNT(*) FROM dbo.vw_band_motor_compatibiliteit) AS compat
  `);
  assert.ok(Number(row.leveranciers) > 0);
  assert.ok(Number(row.motortypes) > 0);
  assert.ok(Number(row.motor_specs) > 0);
  assert.ok(Number(row.band_types) > 0);
  assert.ok(Number(row.compat) > 0);
});
