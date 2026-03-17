// ================================================
// LÓGICA DEL BOT CON IA (GROQ) - FARMASI
// ================================================

const axios = require("axios");
const { CATALOGO_FARMASI } = require("./catalog");
const { iniciarPedido, procesarPedido, tienePedidoActivo } = require("./orders");

const INSTAGRAM_TOKEN = process.env.INSTAGRAM_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Historial de conversación por usuario (máx 50 usuarios en memoria)
const conversationHistory = new Map();
const MAX_USERS = 50;
const MAX_TURNS = 10; // turnos por usuario

const SYSTEM_PROMPT = `Eres Valentina, la asistente virtual de Janeth Vera, consultora oficial de Farmasi Ecuador (@justinaveera).

Tu personalidad:
- Amable, cálida y profesional
- Hablas en español latinoamericano natural
- Usas emojis con moderación para ser más cercana
- Eres experta en todos los productos Farmasi
- Siempre ofreces ayuda adicional al final de cada respuesta

Información de la tienda:
- Vendedora: Janeth Vera | Instagram: @justinaveera
- Envíos a todo Ecuador 🇪🇨
- Guayaquil: 1-2 días hábiles | Resto del país: 3-5 días hábiles
- Envío GRATIS en compras mayores a $50
- Métodos de pago: Efectivo, transferencia bancaria, depósito, tarjeta, PayPhone
- Garantía: 7 días para cambios o devoluciones
- Productos 100% originales de Farmasi

CATÁLOGO COMPLETO CON PRECIOS:
${CATALOGO_FARMASI}

Reglas importantes:
1. NUNCA inventes precios ni productos fuera del catálogo
2. Si no sabes algo, di que Janeth te contactará directamente
3. Cuando el cliente quiera hacer un pedido, responde ÚNICAMENTE con la palabra: INICIAR_PEDIDO
4. Respuestas cortas y directas — máximo 3 párrafos
5. Ayuda a elegir tonos según el tipo de piel y preferencias del cliente
6. Si preguntan por algo de skincare, menciona la línea Dr. C. Tuna`;

// Obtiene respuesta de Groq con reintentos
async function getAIResponse(userId, userMessage) {
  // Inicializar historial
  if (!conversationHistory.has(userId)) {
    // Limpiar usuarios más antiguos si se llena
    if (conversationHistory.size >= MAX_USERS) {
      const firstKey = conversationHistory.keys().next().value;
      conversationHistory.delete(firstKey);
    }
    conversationHistory.set(userId, []);
  }

  const history = conversationHistory.get(userId);
  history.push({ role: "user", content: userMessage });

  // Mantener solo los últimos N turnos
  if (history.length > MAX_TURNS * 2) {
    history.splice(0, 2);
  }

  // Intentar hasta 2 veces
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.1-8b-instant",
          max_tokens: 500,
          temperature: 0.7,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...history
          ]
        },
        {
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 15000 // 15 segundos máximo
        }
      );

      const assistantMessage = response.data.choices[0].message.content;
      history.push({ role: "assistant", content: assistantMessage });
      return assistantMessage;

    } catch (error) {
      console.error(`❌ Groq intento ${attempt}:`, error.response?.data?.error?.message || error.message);
      if (attempt === 2) {
        // Respuesta de fallback si Groq falla
        return "¡Hola! 😊 En este momento tengo un pequeño inconveniente técnico. Por favor escríbele directamente a Janeth Vera (@justinaveera) y te atenderá enseguida. ¡Disculpa las molestias!";
      }
      // Esperar 1 segundo antes de reintentar
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

// Enviar mensaje a Instagram con manejo de límite de caracteres
async function sendMessage(recipientId, message) {
  if (!message || message.trim() === "") return;

  // Instagram permite máximo 1000 caracteres
  if (message.length <= 950) {
    await sendSingleMessage(recipientId, message);
  } else {
    // Dividir en partes respetando palabras
    const words = message.split(" ");
    let part = "";
    const parts = [];

    for (const word of words) {
      if ((part + " " + word).length > 900) {
        parts.push(part.trim());
        part = word;
      } else {
        part += (part ? " " : "") + word;
      }
    }
    if (part) parts.push(part.trim());

    for (const p of parts) {
      await sendSingleMessage(recipientId, p);
      await new Promise(r => setTimeout(r, 600));
    }
  }
}

async function sendSingleMessage(recipientId, message) {
  try {
    await axios.post(
      "https://graph.facebook.com/v19.0/me/messages",
      {
        recipient: { id: recipientId },
        message: { text: message }
      },
      {
        params: { access_token: INSTAGRAM_TOKEN },
        timeout: 10000
      }
    );
    console.log(`✅ Mensaje enviado a ${recipientId}`);
  } catch (error) {
    const errData = error.response?.data?.error;
    console.error("❌ Error Instagram API:", errData?.message || error.message);
  }
}

// Procesa el mensaje entrante
async function handleMessage(senderId, messageText) {
  if (!messageText || !senderId) return;

  const msg = messageText.trim();
  if (msg.length === 0) return;

  console.log(`📨 [${new Date().toISOString()}] De ${senderId}: ${msg.substring(0, 80)}`);

  // Si hay pedido activo, continuar ese flujo primero
  if (tienePedidoActivo(senderId)) {
    const respuestaPedido = procesarPedido(senderId, msg);
    if (respuestaPedido) {
      await sendMessage(senderId, respuestaPedido);
      return;
    }
  }

  // Obtener respuesta de la IA
  const aiResponse = await getAIResponse(senderId, msg);
  if (!aiResponse) return;

  // Detectar si la IA quiere iniciar un pedido
  if (aiResponse.trim() === "INICIAR_PEDIDO" || aiResponse.includes("INICIAR_PEDIDO")) {
    const inicioPedido = iniciarPedido(senderId);
    await sendMessage(senderId, inicioPedido);
    return;
  }

  await sendMessage(senderId, aiResponse);
}

module.exports = { handleMessage };
