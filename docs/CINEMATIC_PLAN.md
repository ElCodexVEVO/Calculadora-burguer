# Modernización Burger Shot

Rama: `codex/cinematic-profiles`. Base estable: `f901481`.

Auditoría: aplicación HTML/CSS/JavaScript sin framework, módulos IIFE; Supabase Auth, Postgres con RLS, Storage y Realtime; distribución web estática y Electron. `app.js` conserva carga paginada, ventas, comisiones, permisos y reportes. `companion.js` conserva caja auxiliar; `v6-modules.js` conserva administración, clientes y promociones. Los demos se generan desde `index.html` con un cliente simulado separado.

1. Reutilizar logo, iconografía SVG, banner, métricas, gráficos, recibos y controles existentes. Centralizar la nueva paleta y añadir escena de restaurante optimizada, sin interfaz incrustada.
2. Sidebar plegable persistente en escritorio, cajón accesible en móvil, buscador de secciones autorizado y acceso a Mi perfil.
3. Módulo independiente de identidad: avatar común, editor local de foto 512 px, Mi perfil con ventas activas reales, filtros de periodo existentes y reconocimiento actual.
4. Tabla aditiva `employee_appearance`, bucket privado y Edge Function autenticada. No ampliar permisos de edición de `profiles`. Preferencias propias por RPC; fotos mediante validación/recodificación del servidor y actualización con control de versión.
5. Tres niveles de efectos, preferencia por empleado, reducción de movimiento del sistema, pausa al ocultar pestaña y partículas limitadas por dispositivo. Mantener confirmaciones posteriores al éxito de las ventas.
6. Pruebas de regresión, SQL/RLS, procesamiento y estados, revisión responsive y documentación de despliegue. Publicar la rama; no migrar ni reemplazar main sin una validación real del backend.

La disponibilidad de credenciales de despliegue de Supabase se comprobará sin mostrar secretos. Si falta acceso, la entrega incluirá SQL, función y comandos completos; la persistencia entre dispositivos se declarará pendiente hasta aplicar y validar el despliegue real.
