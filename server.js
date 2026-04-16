const express = require("express");
const cors = require("cors");
const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();
app.use(cors({ allowedHeaders: ["Content-Type", "x-update-secret"] }));
app.use(express.json());
app.use(express.raw({ type: "application/octet-stream", limit: "1mb" }));

// Chrome Private Network Access: permite POST desde HTTPS a localhost
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-update-secret");
  res.header("Access-Control-Allow-Private-Network", "true");
  res.sendStatus(204);
});

const PORT = process.env.PORT || 3001;

// EXEC_DIR: directorio real del .exe en produccion, o __dirname en desarrollo
const IS_PKG = typeof process.pkg !== "undefined";
const EXEC_DIR = IS_PKG ? path.dirname(process.execPath) : __dirname;

// Leer configuracion desde config.json (creado por instalar.bat)
let PRINTER_NAME = process.env.PRINTER_NAME || "80mm Series Printer";
try {
  const configPath = path.join(EXEC_DIR, "config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (config.printer) PRINTER_NAME = config.printer;
  }
} catch {
  console.warn("[WARN] No se pudo leer config.json, usando impresora por defecto.");
}

// PS1 embebido en el exe via pkg assets, se extrae a temp al arrancar
const PS1_PATH = path.join(os.tmpdir(), "cydens-print.ps1");
fs.writeFileSync(PS1_PATH, fs.readFileSync(path.join(__dirname, "send-to-printer.ps1")));

// ─── Enviar RAW a la impresora Windows via PowerShell ────────────────────────
function sendToPrinter(buffer) {
  const tmpFile = path.join(os.tmpdir(), `ticket-${Date.now()}.bin`);
  fs.writeFileSync(tmpFile, buffer);
  const script = PS1_PATH;
  try {
    const out = execSync(
      `powershell -ExecutionPolicy Bypass -File "${script}" -PrinterName "${PRINTER_NAME}" -FilePath "${tmpFile}"`,
      { stdio: "pipe" },
    );
    console.log(out.toString().trim());
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {}
  }
}

// ─── Endpoints ────────────────────────────────────────────────────────────────
app.get("/status", (req, res) => {
  res.json({ ok: true, printer: PRINTER_NAME });
});

// Actualizar desde GitHub y reiniciar el servicio
app.post("/update", (req, res) => {
  const secret = req.headers["x-update-secret"];
  if (secret !== "cydens-print-2024") {
    return res.status(401).json({ error: "No autorizado" });
  }
  res.json({ message: "Actualizando servidor..." });
  const runner = path.join(EXEC_DIR, "update-runner.bat");
  // Ejecutar en background para que el servidor pueda responder primero
  require("child_process").spawn("cmd.exe", ["/c", runner], {
    detached: true,
    stdio: "ignore",
  }).unref();
});

app.post("/print", (req, res) => {
  const buffer = req.body;
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return res.status(400).json({ success: false, error: "Cuerpo vacío o tipo incorrecto" });
  }
  try {
    sendToPrinter(buffer);
    console.log(`[OK] Ticket imprimido (${buffer.length} bytes)`);
    res.json({ success: true });
  } catch (err) {
    console.error("[ERROR]", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(` Cydens - Servidor de impresion`);
  console.log(` Puerto    : ${PORT}`);
  console.log(` Impresora : ${PRINTER_NAME}`);
  console.log(`========================================\n`);
});
