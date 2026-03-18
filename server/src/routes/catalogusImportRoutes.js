const path = require("path");
const { spawn } = require("child_process");

function safeWorkbookPath(rawValue) {
  const baseDir = path.resolve(process.cwd(), "Project_uiteenzetting");
  const fallback = path.join(baseDir, "Ammdrive overzicht en berekening.xlsx");
  const value = String(rawValue || "").trim();
  if (!value) return fallback;
  const resolved = path.resolve(value);
  if (!resolved.startsWith(baseDir)) return null;
  if (!resolved.toLowerCase().endsWith(".xlsx")) return null;
  return resolved;
}

function runImportScript({ workbookPath, dryRun }) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(process.cwd(), "scripts", "import_ammdrive.py");
    const args = [scriptPath, "--file", workbookPath, dryRun ? "--dry-run" : "--apply"];
    const child = spawn("python", args, { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || `Import script failed with exit code ${code}.`));
      }
      const lines = stdout
        .split(/\r?\n/g)
        .map((line) => line.trim())
        .filter(Boolean);
      const lastLine = lines[lines.length - 1];
      try {
        const parsed = JSON.parse(lastLine || "{}");
        return resolve(parsed);
      } catch {
        return reject(new Error(`Unexpected import output: ${stdout || stderr}`));
      }
    });
  });
}

function registerCatalogusImportRoutes({ app, ensureDbConfigured, requireAuth, requirePermission }) {
  const adminGuard = [requireAuth, requirePermission("/accounts*")];

  app.post("/api/admin/ammdrive-import", ...adminGuard, async (req, res) => {
    if (!(await ensureDbConfigured(res))) return;
    try {
      const dryRun = req.body?.dry_run !== false;
      if (!dryRun) {
        const confirmation = String(req.body?.confirm || "").trim();
        if (confirmation !== "IMPORT_AMMDRIVE") {
          return res.status(400).json({
            error: "Apply import requires explicit confirmation.",
            hint: "Set confirm=IMPORT_AMMDRIVE to execute write mode.",
          });
        }
      }

      const workbookPath = safeWorkbookPath(req.body?.workbook_path);
      if (!workbookPath) {
        return res.status(400).json({ error: "Invalid workbook path. Allowed: Project_uiteenzetting/*.xlsx" });
      }

      const result = await runImportScript({ workbookPath, dryRun });
      res.json({
        success: true,
        mode: dryRun ? "dry-run" : "apply",
        result,
      });
    } catch (error) {
      res.status(500).json({ error: "Ammdrive import failed.", detail: String(error?.message || error) });
    }
  });
}

module.exports = { registerCatalogusImportRoutes };
