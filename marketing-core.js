/* Helpers shared by the announcement editor, checkout and tests. */
(function (root, factory) {
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  else root.BurgerMarketingCore = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const variables = ['negocio', 'ubicacion', 'horario', 'oferta', 'codigo', 'evento', 'contacto'];
  const templates = [
    { id: 'opening', name: 'Apertura', body: '¡{negocio} está abierto! Te esperamos en {ubicacion}. Hamburguesas, combos y algo rico para seguir el día. {horario}' },
    { id: 'offer', name: 'Promoción', body: '¡Hay promo en {negocio}! {oferta} Pide con el código {codigo}. Te esperamos en {ubicacion}.' },
    { id: 'event', name: 'Evento', body: '¡{negocio} te invita a {evento}! Nos vemos en {ubicacion}. {horario} Más información: {contacto}.' },
    { id: 'closing', name: 'Cierre', body: '¡Gracias por acompañarnos en {negocio}! Cerramos por hoy. Nos vemos en el próximo turno.' },
    { id: 'custom', name: 'Personalizado', body: '{negocio}: escribe aquí tu anuncio.' }
  ];
  const code = value => String(value || '').trim().toUpperCase();
  function announcement(body, values, prefix = '') {
    const missing = new Set();
    const text = String(body || '').replace(/\{([a-z_]+)\}/gi, (token, key) => {
      const value = String(values[key.toLowerCase()] ?? '').trim();
      if (!value) { missing.add(key.toLowerCase()); return token; }
      return value;
    });
    return { text: [String(prefix).trim(), text.trim()].filter(Boolean).join(' '), missing: [...missing] };
  }
  function stamp(c) {
    return JSON.stringify({ client: c.client, lines: c.lines.map(p => [p.id, p.qty, Number(p.price), p.active, p.tag, p.restriction]).sort((a, b) => a[0].localeCompare(b[0])) });
  }
  function quoteMatches(lines, quoted) {
    return Array.isArray(quoted) && lines.length === quoted.length && lines.every(p => quoted.some(q => q.id === p.id && Number(q.qty) === Number(p.qty) && Number(q.price) === Number(p.price)));
  }
  function couponState(c, now = Date.now()) {
    if (!c.active) return 'Pausado';
    if (c.starts_at && new Date(c.starts_at).getTime() > now) return 'Programado';
    if (c.ends_at && new Date(c.ends_at).getTime() <= now) return 'Vencido';
    if (c.max_uses != null && Number(c.uses) >= Number(c.max_uses)) return 'Agotado';
    return 'Activo';
  }
  return { variables, templates, code, announcement, stamp, quoteMatches, couponState };
});
