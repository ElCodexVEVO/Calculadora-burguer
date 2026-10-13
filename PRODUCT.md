# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Empleados (cajeros) y administradores de un negocio Burger Shot dentro de un servidor de roleplay de GTA V (FiveM). Durante el turno cobran pedidos a otros jugadores, registran ventas y consultan su rendimiento. Usan la herramienta por igual en una ventana de PC junto al juego (o la app de escritorio Electron de `desktop/`) y en móvil o tableta.

## Product Purpose

Punto de venta y panel de gestión: calcular pedidos con precios, convenios, promociones y cupones; registrar la venta con cliente y método de pago; repartir comisiones; hacer cortes de pago; y consultar ventas, estadísticas, equipo, clientes y auditoría. El éxito es cobrar rápido y sin errores de importe, con totales siempre exactos.

## Operating Context

Se opera de noche, en sesiones de roleplay, a menudo con el juego en primer plano. El cajero alterna entre el juego y la caja, copia totales al chat de FiveM y puede leer avisos de pago con OCR local. Los datos viven en Supabase (Auth, RLS, Realtime, Edge Functions `employee-admin` y `discord-notify`). Se publica como sitio estático en GitHub Pages desde `main`.

## Capabilities and Constraints

- HTML, CSS y JavaScript sin compilación; Supabase JS desde CDN. No migrar de stack ni añadir dependencias grandes.
- Conservar contratos de datos, reglas de cálculo (`calc`, convenios, restricciones EMS/Policía/Sheriff, promociones, cupones), permisos por rol y RLS.
- Funciones: acceso con usuario o correo, administrador inicial, caja con cantidades (+5/+10/+25/+50), plantillas de pedidos, caja auxiliar, cobro, edición/anulación de órdenes, ventas, estadísticas, empleados, empleado de la semana, rendimiento del equipo, cortes, convenios, productos, clientes frecuentes, promociones y cupones, historial de clientes, auditoría, ajustes, notificaciones a Discord.
- Cliente de la semana: se muestra en la sección Clientes, no en el inicio (decisión del usuario, 2026-10-09). Se calcula con las ventas activas de lunes a domingo agrupadas por Cliente / ID.
- La gráfica de actividad semanal sigue en el inicio; Estadísticas conserva sus gráficas.
- Mi perfil muestra nombre, rol, usuario público, estado y fecha de incorporación si está registrada; ventas activas propias, vendido y comisiones del mes, actividad semanal, cinco ventas recientes y reconocimiento semanal vigente. Usa solo datos visibles para la cuenta; muestra estados vacíos cuando faltan.
- Fotografía de perfil: editor con JPG/PNG/WebP de hasta 5 MB, recorte, zoom, reposición, vista previa, guardado, cambio y eliminación para restaurar iniciales. Produce JPEG de 512×512 y actualiza los avatares compartidos en encabezado, sidebar, cuenta, perfil, empleados, empleado de la semana y clasificaciones. La persistencia privada requiere la actualización de Supabase indicada abajo.
- Efectos visuales en Mi perfil y Ajustes: Cinematográfico, Equilibrado y Rendimiento. La preferencia se aplica y conserva localmente por empleado; su sincronización entre dispositivos requiere `employee_appearance` y `set_my_effects`. Respeta movimiento reducido y pausa los bucles con la pestaña oculta.
- `DEMO_V6.html` y `DEMO_ACCESO.html` usan datos simulados y nunca contactan con Supabase.

## Brand Commitments

- Nombre: Burger Shot (BURGER SHOT en el lettering).
- Temática obligatoria de temporada: Día de Muertos y Halloween (cempasúchil, papel picado, velas, calaveras, calabazas).
- Paleta pedida: fondos carbón, superficies con separación clara, texto crema, acentos naranja cempasúchil y detalles morado o vino.
- Logo: conservar el emblema 3D aprobado `assets/logo/burgershot-3d.png` y sus variantes `assets/logo/burgershot-3d-*.webp`, con el lettering integrado y su proporción. No redibujar ni recolorear el arte; usar sus copias optimizadas y favicons existentes.
- Fotografías del menú en `assets/menu/` (origen en `assets/menu/ORIGEN.json`): conservar proporción y relación con cada producto.

## Evidence on Hand

Catálogo, precios y convenios reales viven en Supabase; los de la demo están en `demo/mock-supabase.js` y `demo/data.js` y son simulados. No inventar estadísticas, clientes, reglas ni precios.

Estado de perfiles (12 de octubre de 2026): después de la autorización explícita del usuario se aplicó `employee_appearance`, el bucket privado `employee-avatars`, la RPC `set_my_effects` y Edge Function `profile-photo` al Supabase real. Se verificaron RLS, permisos, bucket privado, rechazo de JWT inválido y preferencia propia mediante transacción revertida. Los conteos e importes financieros se conservaron. La edición completa de fotos se comprobó en demo y con backend simulado; falta comprobar el ciclo autenticado y entre dispositivos con cuentas reales. Las 170 pruebas y estos límites se detallan en `docs/CINEMATIC_QA.md` y `docs/PROFILE_DEPLOYMENT.md`. Si el backend no está disponible, la interfaz explica la limitación y conserva las operaciones del punto de venta.

## Product Principles

1. El total es sagrado: cualquier efecto acompaña al importe real, nunca lo retrasa ni lo oculta.
2. Rapidez antes que adorno: los controles de trabajo quedan despejados; la decoración vive en márgenes, cabeceras y separadores.
3. Una sola identidad de temporada en toda la app, coherente de la pantalla de acceso al último panel.
4. Igual de usable con ratón y teclado junto al juego que con el pulgar en el móvil.

## Accessibility & Inclusion

Contraste AA, foco visible, navegación por teclado, objetivos táctiles cómodos y respeto de `prefers-reduced-motion` y del ajuste «Animaciones suaves» de la app.
