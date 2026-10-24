/* Burger Shot 3D · RestaurantPresenceManager.
   Presencia temporal con Supabase Realtime Presence sobre el cliente `sb` existente.
   - Solo se transmite { uid, tab, at, zone, away, activity }: ni nombres, ni roles, ni tokens, ni importes.
   - Nombres, fotos y roles se resuelven con `profiles` (protegido por RLS) en cada cliente.
   - Una persona = un usuario autenticado, aunque tenga varias pestañas abiertas.
   - La presencia desaparece sola cuando se cierra la conexión: no hay marcas permanentes en la base. */
(function (root) {
  'use strict';
  const ZONES = ['floor', 'counter'];
  const ACTIVITIES = ['order', 'deliver']; // tomando pedido · entregando comida (sin importes ni clientes)
  const ID = /^[A-Za-z0-9_-]{1,64}$/;

  function tabId() {
    try { return crypto.randomUUID(); } catch { return 'tab-' + Math.random().toString(36).slice(2) + Date.now().toString(36); }
  }

  /* Acepta solo metadatos bien formados cuya clave coincide con el usuario declarado. */
  function sanitize(meta, key) {
    if (!meta || typeof meta !== 'object') return null;
    const uid = typeof meta.uid === 'string' ? meta.uid : '';
    if (!uid || uid !== key || !ID.test(uid)) return null;
    const at = Date.parse(meta.at);
    return {
      uid,
      tab: typeof meta.tab === 'string' ? meta.tab.slice(0, 64) : '',
      at: Number.isFinite(at) ? at : Date.now(),
      zone: ZONES.includes(meta.zone) ? meta.zone : 'floor',
      away: meta.away === true,
      activity: ACTIVITIES.includes(meta.activity) ? meta.activity : ''
    };
  }

  /* presenceState() → personas conectadas: una fila por usuario activo de la tienda. */
  function normalize(state, employees) {
    const active = new Set((employees || []).filter(e => e && e.user_id && e.active !== false).map(e => e.user_id));
    const people = new Map();
    for (const [key, metas] of Object.entries(state || {})) {
      if (!Array.isArray(metas)) continue;
      for (const raw of metas) {
        const meta = sanitize(raw, key);
        if (!meta || !active.has(meta.uid)) continue;
        let row = people.get(meta.uid);
        if (!row) { row = { uid: meta.uid, tabs: 0, since: meta.at, zone: 'floor', away: true, activity: '' }; people.set(meta.uid, row); }
        row.tabs++;
        row.since = Math.min(row.since, meta.at);
        if (!meta.away) { row.away = false; if (meta.zone === 'counter') row.zone = 'counter'; }
        if (meta.activity === 'deliver' || (meta.activity === 'order' && row.activity !== 'deliver')) row.activity = meta.activity;
      }
    }
    return [...people.values()]
      .map(r => ({ ...r, zone: r.away ? 'away' : r.zone, activity: r.away ? '' : r.activity }))
      .sort((a, b) => a.since - b.since || a.uid.localeCompare(b.uid));
  }

  function diff(prev, next) {
    const before = new Set((prev || []).map(p => p.uid)), after = new Set((next || []).map(p => p.uid));
    return {
      joined: (next || []).filter(p => !before.has(p.uid)).map(p => p.uid),
      left: (prev || []).filter(p => !after.has(p.uid)).map(p => p.uid)
    };
  }

  function create({ sb, storeId, userId, privateChannel = false, onChange, onStatus, now = () => new Date().toISOString(), debounce = 350 } = {}) {
    let channel = null, status = 'idle', timer = 0, stopped = true, startedAt = now();
    let local = { zone: 'floor', away: false, activity: '' };
    const tab = tabId();
    const setStatus = s => { if (s === status) return; status = s; onStatus?.(s); };
    const payload = () => ({ uid: userId, tab, at: startedAt, zone: local.zone, away: local.away, activity: local.activity });
    const read = () => { try { return channel?.presenceState?.() || {}; } catch { return {}; } };

    async function track() {
      const ch = channel;
      if (!ch || stopped || status !== 'live') return false;
      try {
        const result = await ch.track(payload());
        if (ch !== channel) return false;
        if (result === 'error' || result === 'timed out') { setStatus('error'); return false; }
        return true;
      } catch { if (ch === channel) setStatus('error'); return false; }
    }

    function start() {
      if (!stopped && channel) return;
      if (!sb || typeof sb.channel !== 'function' || !storeId || !userId) { setStatus('unavailable'); return; }
      stopped = false; startedAt = now();
      let ch;
      try {
        ch = sb.channel(`bs-presence-${storeId}`, { config: { presence: { key: userId }, private: Boolean(privateChannel) } });
      } catch { setStatus('unavailable'); return; }
      if (!ch || typeof ch.track !== 'function' || typeof ch.presenceState !== 'function') {
        try { sb.removeChannel?.(ch); } catch {}
        setStatus('unavailable'); return;
      }
      channel = ch;
      ch.on('presence', { event: 'sync' }, () => { if (ch === channel && !stopped) onChange?.(read()); });
      setStatus('connecting');
      ch.subscribe(s => {
        if (ch !== channel || stopped) return;
        // Tras una reconexión el canal vuelve a SUBSCRIBED: se publica de nuevo la presencia propia.
        if (s === 'SUBSCRIBED') { setStatus('live'); track(); }
        else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') setStatus('error');
        else if (s === 'CLOSED') setStatus('closed');
      });
    }

    function update(patch) {
      const next = {
        zone: ZONES.includes(patch?.zone) ? patch.zone : local.zone,
        away: typeof patch?.away === 'boolean' ? patch.away : local.away,
        activity: patch && 'activity' in patch ? (ACTIVITIES.includes(patch.activity) ? patch.activity : '') : local.activity
      };
      if (next.zone === local.zone && next.away === local.away && next.activity === local.activity) return;
      local = next;
      clearTimeout(timer);
      // Antes de conectar solo se guarda: la suscripción publicará el estado vigente.
      if (status === 'live') timer = setTimeout(track, debounce);
    }

    async function stop() {
      stopped = true; clearTimeout(timer);
      const ch = channel; channel = null;
      if (ch) {
        try { await ch.untrack?.(); } catch {}
        try { await sb.removeChannel?.(ch); } catch {}
      }
      setStatus('idle');
    }

    async function restart() { await stop(); start(); }

    return {
      start, stop, restart, update, track,
      get status() { return status; },
      get tab() { return tab; },
      get local() { return { ...local }; },
      state: read
    };
  }

  const api = { normalize, diff, sanitize, create, ACTIVITIES };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BurgerRestaurantPresence = api;
})(typeof window !== 'undefined' ? window : globalThis);
