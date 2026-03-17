// ================================================
// SERVIDOR PRINCIPAL - FARMASI INSTAGRAM BOT
// Versión production-ready para Railway
// ================================================

require("dotenv").config();
const express = require("express");
const { handleMessage } = require("./bot");

const app = express();

// ── Middlewares ───────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Validar variables de entorno al arrancar
const REQUIRED_ENV = ["INSTAGRAM_TOKEN", "APP_SECRET", "VERIFY_TOKEN", "GROQ_API_KEY"];
const missing = REQUIRED_ENV.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error("❌ Variables de entorno faltantes:", missing.join(", "));
  process.exit(1);
}

// ── Health check (Railway lo usa para saber si el server está vivo) ──
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    bot: "Farmasi Instagram Bot",
    timestamp: new Date().toISOString()
  });
});

// ── Verificación del webhook (GET) ──────────────
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado por Meta");
    return res.status(200).send(challenge);
  }
  console.warn("⚠️ Token de verificación incorrecto");
  return res.sendStatus(403);
});

// ── Recepción de mensajes (POST) ─────────────────
app.post("/webhook", (req, res) => {
  // Responder 200 inmediatamente — Meta cancela si tardas más de 20s
  res.sendStatus(200);

  try {
    const body = req.body;

    if (body.object !== "instagram") return;

    const entries = body.entry || [];

    for (const entry of entries) {
      const messagingEvents = entry.messaging || [];

      for (const event of messagingEvents) {
        // Ignorar mensajes del propio bot (echo)
        if (event.message?.is_echo) continue;

        // Ignorar eventos sin texto (stickers, imágenes, etc.)
        const senderId = event.sender?.id;
        const messageText = event.message?.text;
        if (!senderId || !messageText) continue;

        // Procesar en background — no bloquea el servidor
        handleMessage(senderId, messageText).catch(err => {
          console.error("❌ Error en handleMessage:", err.message);
        });
      }
    }
  } catch (err) {
    console.error("❌ Error procesando webhook:", err.message);
  }
});

// ── 404 catch-all ─────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Error handler global ──────────────────────────
app.use((err, req, res, next) => {
  console.error("❌ Error no manejado:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// ── Iniciar servidor ──────────────────────────────
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Farmasi Bot corriendo en puerto ${PORT}`);
  console.log(`📡 Webhook listo en /webhook`);
});

// ── Graceful shutdown (evita crashes en Railway) ──
process.on("SIGTERM", () => {
  console.log("📴 Apagando servidor...");
  server.close(() => {
    console.log("✅ Servidor cerrado correctamente");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});

// Evitar que errores no capturados cierren el proceso
process.on("uncaughtException", (err) => {
  console.error("❌ uncaughtException:", err.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ unhandledRejection:", reason);
});
