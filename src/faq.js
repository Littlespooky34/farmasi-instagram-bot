// ================================================
// PREGUNTAS FRECUENTES - FARMASI
// ================================================

const faqs = [
  {
    keywords: ["envio", "envío", "delivery", "domicilio", "llegan", "demora"],
    respuesta: "🚚 *Información de Envíos*\n\nHacemos envíos a todo Ecuador 🇪🇨\n\n📦 Tiempo de entrega:\n   • Guayaquil: 1-2 días hábiles\n   • Costa e Interandina: 3-5 días hábiles\n   • Galápagos: 7-10 días hábiles\n\n💰 Costo de envío: Desde $3.00\n🎁 Envío GRATIS en compras mayores a $50.00\n\n¿Tienes alguna otra pregunta?"
  },
  {
    keywords: ["precio", "costo", "cuanto", "cuánto", "vale", "valor"],
    respuesta: "💰 *Nuestros Precios*\n\nTenemos productos desde $8.00 hasta $35.00\n\n✨ Ofrecemos los mejores precios del mercado con productos de calidad garantizada.\n\nEscribe *CATÁLOGO* para ver todos los productos con sus precios 📋"
  },
  {
    keywords: ["pago", "pagar", "transferencia", "efectivo", "tarjeta", "deposito", "depósito"],
    respuesta: "💳 *Métodos de Pago*\n\nAceptamos:\n✅ Efectivo\n✅ Transferencia bancaria\n✅ Depósito bancario\n✅ Tarjeta de crédito/débito\n✅ PayPhone\n\nDatos bancarios te los enviamos al confirmar tu pedido 📝"
  },
  {
    keywords: ["devolucion", "devolución", "cambio", "garantia", "garantía", "defecto"],
    respuesta: "🔄 *Política de Devoluciones*\n\nTu satisfacción es nuestra prioridad ❤️\n\n✅ Tienes *7 días* para solicitar cambios\n✅ Producto debe estar sin uso y en su empaque original\n✅ Si el producto llegó defectuoso, lo cambiamos sin costo\n\nEscríbenos para gestionar tu devolución 📩"
  },
  {
    keywords: ["original", "genuino", "autentico", "auténtico", "falso"],
    respuesta: "✅ *Productos 100% Originales*\n\nSomos distribuidores oficiales de Farmasi Ecuador 🇪🇨\n\nTodos nuestros productos son:\n✅ 100% originales y garantizados\n✅ Con registro sanitario\n✅ Importados directamente de Farmasi\n\n¡Compra con total confianza! 🛡️"
  },
  {
    keywords: ["oferta", "descuento", "promocion", "promoción", "promo", "rebaja"],
    respuesta: "🎉 *Ofertas y Promociones*\n\n¡Tenemos promociones especiales!\n\n🔥 Ofertas actuales:\n   • 2x1 en labiales seleccionados\n   • 20% OFF en cremas hidratantes\n   • Envío gratis en compras +$50\n\nEscribe *CATÁLOGO* para ver todos los productos 🛍️"
  }
];

function getFAQResponse(message) {
  const msgLower = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  for (const faq of faqs) {
    if (faq.keywords.some(keyword => msgLower.includes(keyword))) {
      return faq.respuesta;
    }
  }
  return null;
}

module.exports = { getFAQResponse };
