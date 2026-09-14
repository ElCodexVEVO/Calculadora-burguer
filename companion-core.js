/* Pure helpers shared by the companion UI and its regression tests. */
(function (root, factory) {
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  else root.BurgerCompanionCore = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const key = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();
  function amount(value) {
    let text = String(value ?? '').trim().replace(/^(?:MXN|USD|\$)\s*/i, '').replace(/\s*(?:MXN|USD)$/i, '').trim();
    if (!/^\d[\d.,]*$/.test(text)) return null;
    if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(text)) text = text.replace(/,/g, '');
    else if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(text)) text = text.replace(/\./g, '').replace(',', '.');
    else if (/^\d+([.,]\d{1,2})?$/.test(text)) text = text.replace(',', '.');
    else return null;
    const result = Number(text);
    return Number.isFinite(result) && result >= 0 && result <= 999999999 ? result : null;
  }
  function quantity(value, allowZero = false) {
    const text = String(value ?? '').trim();
    if (!/^\d+$/.test(text)) return null;
    const result = Number(text);
    const minimum = allowZero ? 0 : 1;
    return Number.isSafeInteger(result) && result >= minimum && result <= 9999 ? result : null;
  }
  function readPayment(text) {
    const source = String(text || '').replace(/\r/g, '');
    const matches = [...source.matchAll(/(?:\$|MXN\s+)\s*(\d[\d.,]*\d|\d)(?=\s|$|[^\d.,]|[.,](?:\s|$))/gi)];
    const amounts = [...new Set(matches.map(m => amount(m[1])).filter(n => n !== null))];
    let client = '';
    const patterns = [
      /^\s*(?:Cliente(?:\s*\/\s*ID)?|Nombre)\s*:\s*([^\n]+)$/im,
      /^\s*([^\n:$]{2,120}?)\s+te\s+(?:pag[oó]|transfiri[oó])\s+(?:\$|MXN)/im,
      /(?:recibido|recibiste)\s+(?:\$|MXN)\s*[\d.,]+\s+de\s+([^\n]+)/i
    ];
    for (const pattern of patterns) {
      const match = source.match(pattern);
      if (match) { client = match[1].trim().slice(0, 120); break; }
    }
    return { client, amount: amounts.length === 1 ? amounts[0] : null, ambiguous: amounts.length > 1 };
  }
  function customers(sales) {
    const groups = new Map();
    for (const sale of sales) {
      const label = String(sale.client || '').trim(), id = key(label);
      if (!id || sale.status !== 'active') continue;
      let group = groups.get(id);
      if (!group) { group = { key: id, label, count: 0, last: sale }; groups.set(id, group); }
      group.count++;
      if (String(sale.created_at) > String(group.last.created_at)) { group.last = sale; group.label = label; }
    }
    return [...groups.values()].sort((a, b) => b.count - a.count || String(b.last.created_at).localeCompare(String(a.last.created_at)));
  }
  function repeat(sale, products) {
    if (!sale || !sale.items?.length) return { error: 'No hay una compra anterior para repetir.' };
    const cart = {};
    for (const item of sale.items) {
      const product = products.find(p => p.id === item.id && p.active);
      if (!product) return { error: `${item.name || 'Un producto'} ya no está disponible. Prepara la orden desde el menú.` };
      if (product.restriction && product.restriction !== (sale.client_type || 'general')) return { error: 'La compra anterior contiene productos restringidos. Revisa el menú.' };
      const qty = Number(item.qty);
      if (!Number.isInteger(qty) || qty <= 0 || qty > 9999) return { error: 'La cantidad de la compra anterior no es válida.' };
      cart[item.id] = (cart[item.id] || 0) + qty;
      if (cart[item.id] > 9999) return { error: 'La cantidad es demasiado grande.' };
    }
    return { cart, clientType: sale.client_type || 'general', discountId: sale.discount_id || null };
  }
  function review({ client, received, total, confirmed, hasItems, busy, stale }) {
    if (busy) return 'Espera a que termine la lectura.';
    if (!hasItems) return 'Agrega productos a la orden.';
    if (stale) return 'La orden cambió. Cierra y vuelve a revisar el cobro.';
    if (!String(client || '').trim()) return 'Escribe el nombre o ID del cliente.';
    if (String(client).trim().length > 120) return 'El cliente debe tener como máximo 120 caracteres.';
    const parsed = amount(received);
    if (parsed === null) return 'Escribe un importe válido, por ejemplo 2,000.00.';
    if (!Number.isFinite(total) || Math.round(parsed * 100) !== Math.round(total * 100)) return 'El importe recibido no coincide con el pedido. Revisa el cobro.';
    if (!confirmed) return 'Confirma que recibiste el pago en el juego.';
    return '';
  }
  return { key, amount, quantity, readPayment, customers, repeat, review };
});
