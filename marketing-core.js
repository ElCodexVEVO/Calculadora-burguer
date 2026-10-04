/* Ready-to-copy announcements and pure coupon helpers. */
(function (root, factory) {
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  else root.BurgerMarketingCore = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const announcementCategories = [
    { id: 'humor', name: 'Con humor' }, { id: 'classics', name: 'Para el antojo' },
    { id: 'combos', name: 'Combos y banda' }, { id: 'opening', name: 'Abrimos' },
    { id: 'closing', name: 'Cerramos' }
  ];
  const templates = [
    { id: 'corrientes', category: 'humor', name: 'Entre más corrientes…', body: '🍔 Entre más corrientes, más ricas. En BurgerShot no vendemos modales, vendemos hamburguesas. 😏🔥' },
    { id: 'parrilla', category: 'classics', name: 'Recién hecha', body: '🍔 Pan suave, carne a la parrilla y queso derretido. Así se quita el hambre en BurgerShot. 🔥' },
    { id: 'trio', category: 'combos', name: 'El trío perfecto', body: '🍔🍟🥤 Hamburguesa, papitas y refresco: el trío que sí se pone de acuerdo. Pide tu combo en BurgerShot.' },
    { id: 'cocina-lista', category: 'opening', name: 'Ya estamos atendiendo', body: '🔥 ¡BurgerShot ya está atendiendo! La cocina está lista y el antojo también. Pasa por tu hamburguesa favorita. 🍔🍟' },
    { id: 'ex', category: 'humor', name: 'Mejor con papitas', body: '🍔 Tu ex te dejó con hambre de amor. Nosotros te dejamos con papitas. Tú sabrás qué te conviene. 🍟😌' },
    { id: 'antojo', category: 'classics', name: 'Hazle caso al antojo', body: '🔥 Hazle caso al antojo. Una hamburguesa, unas papitas y una buena pausa en BurgerShot. 🍔🍟' },
    { id: 'queso', category: 'humor', name: 'Queso y pocas excusas', body: '🧀 Tenemos más queso que tus excusas para no venir. Date una vuelta a BurgerShot. 🍔' },
    { id: 'banda', category: 'combos', name: 'Junta a la banda', body: '👥 Junta a la banda y dejen que BurgerShot se encargue del antojo. Hamburguesas y combos para compartir. 🍔🔥' },
    { id: 'mordisco', category: 'classics', name: 'Desde el primer mordisco', body: '🍔 El primer mordisco pone todo en su lugar. Dale gusto al antojo con BurgerShot. 🧀' },
    { id: 'lunes', category: 'humor', name: 'El lunes vemos', body: '🔥 La dieta empieza el lunes. Hoy empieza con una BurgerShot y unas papitas. 🍔🍟' },
    { id: 'bienvenidos', category: 'opening', name: 'Ven con hambre', body: '🍔 ¡Abrimos! Ven con hambre, sal con una sonrisa. En BurgerShot ya te estamos esperando. 🥤' },
    { id: 'completo', category: 'combos', name: 'Date el gusto completo', body: '🍟 Si vas a darte el gusto, dátelo completo. Tu hamburguesa pide compañía: papitas y bebida en BurgerShot. 🥤' },
    { id: 'pausa', category: 'classics', name: 'Una pausa con sabor', body: '🥤 Baja el ritmo, sube el sabor. Tu siguiente parada sabe a BurgerShot. 🍔' },
    { id: 'queso-extra', category: 'humor', name: 'Una relación con el queso', body: '😏 Aquí las únicas relaciones tóxicas son con el queso extra. BurgerShot: una mordida y ya quieres volver. 🍔🧀' },
    { id: 'papitas', category: 'classics', name: 'Estas papitas se defienden', body: '🍟 Lo bueno se comparte… pero estas papitas se defienden. Arma tu pedido en BurgerShot. 🍔' },
    { id: 'sin-compartir', category: 'combos', name: 'Este combo es mío', body: '🧀 Un combo, una pausa y cero ganas de compartir. BurgerShot te entiende. 🍔🍟' },
    { id: 'panza', category: 'humor', name: 'Que no hable la panza', body: '🍔 No arreglamos tu vida, pero sí ese ruido que hace tu panza. BurgerShot te espera. 🍟😏' },
    { id: 'movimiento', category: 'opening', name: 'La cocina está de vuelta', body: '🍟 ¡Ya hay movimiento en la cocina! BurgerShot está abierto y listo para recibir a la banda. 🍔🔥' },
    { id: 'gracias', category: 'closing', name: 'Gracias por venir', body: '🍔 ¡Cerramos por ahora! Gracias por cada pedido y cada visita. BurgerShot se despide con la panza llena y el corazón contento. ❤️' },
    { id: 'proxima', category: 'closing', name: 'Hasta la próxima', body: '🔥 Por hoy apagamos la cocina, pero el antojo se queda. Gracias por acompañarnos en BurgerShot. ¡Nos vemos en la próxima! 🍔' }
  ];
  const code = value => String(value || '').trim().toUpperCase();
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
  return { announcementCategories, templates, code, stamp, quoteMatches, couponState };
});
