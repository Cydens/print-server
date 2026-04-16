const express = require("express");
const cors = require("cors");

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

// CP850 → UTF-8 para los caracteres españoles que usamos
const CP850 = {
  0x82: "é", 0x90: "É",
  0xa0: "á", 0xb5: "Á",
  0xa1: "í", 0xd6: "Í",
  0xa2: "ó", 0xe0: "Ó",
  0xa3: "ú", 0xe9: "Ú",
  0xa4: "ñ", 0xa5: "Ñ",
  0x81: "ü", 0x9a: "Ü",
};

function decodeTicket(buffer) {
  const lines = [];
  let current = "";
  let i = 0;

  while (i < buffer.length) {
    const b = buffer[i];

    // Saltar comandos ESC/POS
    if (b === 0x1b) {
      const cmd = buffer[i + 1];
      if (cmd === 0x40) { i += 2; continue; }           // ESC @ init
      if (cmd === 0x74) { i += 3; continue; }           // ESC t charset
      if (cmd === 0x61) { i += 3; continue; }           // ESC a align
      if (cmd === 0x45) { i += 3; continue; }           // ESC E bold
      if (cmd === 0x64) { i += 3; continue; }           // ESC d feed
      i += 2; continue;
    }
    if (b === 0x1d) { i += 4; continue; }               // GS V cut

    if (b === 0x0a) {                                    // newline
      lines.push(current);
      current = "";
      i++;
      continue;
    }

    if (b >= 32) {
      current += CP850[b] ?? String.fromCharCode(b);
    }

    i++;
  }

  if (current) lines.push(current);
  return lines;
}

app.get("/status", (req, res) => {
  res.json({ ok: true, printer: "Mock Printer (local)" });
});

app.post("/print", (req, res) => {
  const buffer = req.body;
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return res.status(400).json({ success: false, error: "Cuerpo vacío o tipo incorrecto" });
  }

  const lines = decodeTicket(buffer);
  const width = 42;
  const border = "═".repeat(width);

  console.log("\n" + border);
  for (const line of lines) {
    console.log(line);
  }
  console.log(border + "\n");

  res.json({ success: true });
});

app.listen(3001, () => {
  console.log("\n========================================");
  console.log(" Cydens - Mock servidor de impresión");
  console.log(" Puerto : 3001");
  console.log(" El ticket se muestra en consola");
  console.log("========================================\n");
});
