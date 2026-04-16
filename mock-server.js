const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors({ allowedHeaders: ["Content-Type", "x-update-secret"] }));
app.use(express.raw({ type: "application/octet-stream", limit: "1mb" }));

app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-update-secret");
  res.header("Access-Control-Allow-Private-Network", "true");
  res.sendStatus(204);
});

app.get("/status", (req, res) => {
  res.json({ ok: true, printer: "Mock Printer (local)" });
});

app.post("/print", (req, res) => {
  const buffer = req.body;
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return res.status(400).json({ success: false, error: "Cuerpo vacío o tipo incorrecto" });
  }

  const outPath = path.join(__dirname, "ticket.bin");
  fs.writeFileSync(outPath, buffer);

  console.log(`[MOCK] Ticket recibido: ${buffer.length} bytes`);
  console.log(`[MOCK] Guardado en: ${outPath}`);
  console.log(`[MOCK] Preview ESC/POS: https://www.receiptline.com/`);

  res.json({ success: true });
});

app.listen(3001, () => {
  console.log("\n========================================");
  console.log(" Cydens - Mock servidor de impresión");
  console.log(" Puerto : 3001");
  console.log(" Guarda el ticket en ticket.bin");
  console.log("========================================\n");
});
