// ================================================
// SISTEMA DE PEDIDOS - FARMASI
// ================================================

const pedidos = new Map();

const ESTADOS = {
  NOMBRE: "esperando_nombre",
  PRODUCTO: "esperando_producto",
  CANTIDAD: "esperando_cantidad",
  DIRECCION: "esperando_direccion",
  CONFIRMACION: "esperando_confirmacion"
};

function iniciarPedido(userId) {
  pedidos.set(userId, {
    estado: ESTADOS.NOMBRE,
    nombre: null,
    producto: null,
    cantidad: null,
    direccion: null,
    fecha: new Date().toISOString()
  });
  return "📝 *¡Vamos con tu pedido!*\n\n¿Cuál es tu nombre completo?";
}

function procesarPedido(userId, mensaje) {
  if (!pedidos.has(userId)) return null;

  const pedido = pedidos.get(userId);
  const msg = mensaje.trim();

  switch (pedido.estado) {
    case ESTADOS.NOMBRE:
      pedido.nombre = msg;
      pedido.estado = ESTADOS.PRODUCTO;
      return `¡Hola ${pedido.nombre}! 👋\n\n¿Qué producto deseas pedir? Escribe el nombre del producto.\n\n(Si quieres ver el catálogo primero, escribe CATÁLOGO)`;

    case ESTADOS.PRODUCTO:
      pedido.producto = msg;
      pedido.estado = ESTADOS.CANTIDAD;
      return `Perfecto ✅ Anotado: *${pedido.producto}*\n\n¿Qué cantidad deseas?`;

    case ESTADOS.CANTIDAD:
      if (isNaN(msg) || parseInt(msg) < 1) {
        return "Por favor escribe solo el número de unidades que deseas (ej: 1, 2, 3)";
      }
      pedido.cantidad = msg;
      pedido.estado = ESTADOS.DIRECCION;
      return `Cantidad: *${pedido.cantidad}* ✅\n\n¿Cuál es tu dirección de entrega completa?\n(Ciudad, barrio y una referencia)`;

    case ESTADOS.DIRECCION:
      pedido.direccion = msg;
      pedido.estado = ESTADOS.CONFIRMACION;
      return `📋 *Resumen de tu pedido:*\n\n👤 ${pedido.nombre}\n🛍️ ${pedido.producto}\n🔢 Cantidad: ${pedido.cantidad}\n📍 ${pedido.direccion}\n\n¿Confirmas? Responde *SÍ* o *NO*`;

    case ESTADOS.CONFIRMACION: {
      const respuesta = msg.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (respuesta === "SI" || respuesta === "SÍ" || respuesta === "S") {
        const resumen = { ...pedido };
        pedidos.delete(userId);
        console.log("📦 NUEVO PEDIDO:", JSON.stringify(resumen));
        return `✅ *¡Pedido confirmado!*\n\nGracias ${resumen.nombre} 🎉 Recibimos tu pedido de *${resumen.producto}*.\n\nJaneth se contactará contigo pronto para coordinar el pago y la entrega.\n\n¡Gracias por elegir Farmasi! 💄✨`;
      } else {
        pedidos.delete(userId);
        return "❌ Pedido cancelado. Escribe *PEDIR* cuando quieras intentar de nuevo 😊";
      }
    }

    default:
      pedidos.delete(userId);
      return null;
  }
}

function tienePedidoActivo(userId) {
  return pedidos.has(userId);
}

module.exports = { iniciarPedido, procesarPedido, tienePedidoActivo };
