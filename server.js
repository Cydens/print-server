const express = require("express");
const cors = require("cors");
const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();
app.use(cors());
app.use(express.json());

const PRINTER_NAME = process.env.PRINTER_NAME || "80mm Series Printer";
const PORT = process.env.PORT || 3001;

// Cuando corre como .exe compilado con pkg, EXEC_DIR es el directorio real
// donde está el .exe (para leer update-runner.bat en el mismo lugar).
const IS_PKG = typeof process.pkg !== "undefined";
const EXEC_DIR = IS_PKG ? path.dirname(process.execPath) : __dirname;

// El PS1 se lee del virtual filesystem de pkg (o del disco en dev mode)
// y se extrae a temp para que PowerShell pueda ejecutarlo.
const PS1_PATH = path.join(os.tmpdir(), "cydens-print.ps1");
fs.writeFileSync(PS1_PATH, fs.readFileSync(path.join(__dirname, "send-to-printer.ps1")));
const LINE_WIDTH = 42;

// ─── Comandos ESC/POS ─────────────────────────────────────────────────────────
const ESC = "\x1b";
const GS = "\x1d";

const esc = {
  init: () => buf(`${ESC}@`),
  charset: () => buf(`${ESC}t\x02`), // PC850 - soporta acentos español
  alignLeft: () => buf(`${ESC}a\x00`),
  alignCenter: () => buf(`${ESC}a\x01`),
  boldOn: () => buf(`${ESC}E\x01`),
  boldOff: () => buf(`${ESC}E\x00`),
  feed: (n = 1) => buf(`${ESC}d${String.fromCharCode(n)}`),
  cut: () => buf(`${GS}V\x41\x00`),
  text: (str) => Buffer.from(str + "\n", "latin1"),
};

function buf(str) {
  return Buffer.from(str, "binary");
}

function line(char = "-") {
  return esc.text(char.repeat(LINE_WIDTH));
}

// Fila con label a la izquierda y valor a la derecha
function row(label, value) {
  const v = String(value);
  const maxLabel = LINE_WIDTH - v.length - 1;
  const l = label.substring(0, maxLabel);
  const spaces = LINE_WIDTH - l.length - v.length;
  return esc.text(l + " ".repeat(Math.max(1, spaces)) + v);
}

// ─── Formato de precio ────────────────────────────────────────────────────────
function fmt(amount) {
  return (
    "$ " +
    Number(amount).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

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
  const {
    orderNumber,
    fecha,
    hora,
    customer,
    patient,
    dentist,
    products,
    orderTotal,
    ticketInfo,
  } = req.body;

  const parts = [];

  const p = (...bufs) => parts.push(...bufs);

  // Init
  p(esc.init(), esc.charset());

  // Encabezado
  p(esc.alignCenter(), esc.boldOn());
  p(esc.text(`ORDEN DE TRABAJO #${orderNumber}`));
  p(esc.boldOff());
  p(esc.text(`${fecha} - ${hora}`));
  p(line());
  p(esc.text("DOCUMENTO NO VALIDO COMO FACTURA"));
  p(line());

  // Cliente
  p(esc.alignLeft(), esc.boldOn());
  p(esc.text(customer.name.substring(0, LINE_WIDTH)));
  p(esc.boldOff());
  if (customer.address) p(esc.text(customer.address.substring(0, LINE_WIDTH)));
  if (customer.city) p(esc.text(customer.city.substring(0, LINE_WIDTH)));
  p(esc.text(`IVA: ${customer.iva}`));
  p(line());

  // Dentista y paciente
  if (dentist) p(esc.text(`Odont: ${dentist.substring(0, LINE_WIDTH - 7)}`));
  p(esc.text(`Paciente: ${patient.substring(0, LINE_WIDTH - 10)}`));
  p(line());

  // Productos
  for (const product of products) {
    const name =
      product.name.length > LINE_WIDTH
        ? product.name.substring(0, LINE_WIDTH - 3) + "..."
        : product.name;
    p(esc.boldOn(), esc.text(name), esc.boldOff());
    p(row(`  ${product.quantity} x ${fmt(product.price)}`, fmt(product.total)));
  }

  p(line("-"));

  // Total
  p(esc.boldOn());
  p(row("TOTAL", fmt(orderTotal)));
  p(esc.boldOff());

  // Cuenta corriente (opcional)
  if (ticketInfo) {
    p(line());
    p(esc.alignCenter(), esc.boldOn());
    p(esc.text("CUENTA CORRIENTE"));
    p(esc.boldOff(), esc.alignLeft());
    p(line());

    p(row("Saldo anterior", fmt(ticketInfo.lastBalance)));
    p(row("Fact. del mes", fmt(ticketInfo.monthInvoices)));
    p(row("Pagos del mes", fmt(ticketInfo.monthPayments)));
    p(line());

    p(esc.boldOn());
    p(row("Saldo Cta.Cte.", fmt(ticketInfo.actualBalance)));
    p(esc.boldOff());
    p(row("OT entregadas", fmt(ticketInfo.monthInvoices)));
    p(row("Este ticket", fmt(orderTotal)));
    p(line());

    p(esc.boldOn());
    p(row("SALDO TOTAL", fmt(Number(ticketInfo.monthInvoices) + orderTotal)));
    p(esc.boldOff());
  }

  // Pie
  p(line());
  p(esc.alignCenter());
  p(esc.text("Gracias por su confianza"));
  p(esc.feed(3));
  p(esc.cut());

  const buffer = Buffer.concat(parts);

  try {
    sendToPrinter(buffer);
    console.log(`[OK] Imprimido orden #${orderNumber}`);
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
