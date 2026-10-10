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
- `DEMO_V6.html` y `DEMO_ACCESO.html` usan datos simulados y nunca contactan con Supabase.

## Brand Commitments

- Nombre: Burger Shot (BURGER SHOT en el lettering).
- Temática obligatoria de temporada: Día de Muertos y Halloween (cempasúchil, papel picado, velas, calaveras, calabazas).
- Paleta pedida: fondos carbón, superficies con separación clara, texto crema, acentos naranja cempasúchil y detalles morado o vino.
- Logo: el emblema ilustrado con volumen `assets/burgershot-muertos.webp` (hamburguesa con calavera de azúcar, cempasúchil y gotas) se mantiene sin redibujar en toda la app. El usuario descartó una versión vectorial nueva (2026-10-09). Solo se permiten copias redimensionadas del mismo archivo para rendimiento y favicon.
- Fotografías del menú en `assets/menu/` (origen en `assets/menu/ORIGEN.json`): conservar proporción y relación con cada producto.

## Evidence on Hand

Catálogo, precios y convenios reales viven en Supabase; los de la demo están en `demo/mock-supabase.js` y `demo/data.js` y son simulados. No inventar estadísticas, clientes, reglas ni precios.

## Product Principles

1. El total es sagrado: cualquier efecto acompaña al importe real, nunca lo retrasa ni lo oculta.
2. Rapidez antes que adorno: los controles de trabajo quedan despejados; la decoración vive en márgenes, cabeceras y separadores.
3. Una sola identidad de temporada en toda la app, coherente de la pantalla de acceso al último panel.
4. Igual de usable con ratón y teclado junto al juego que con el pulgar en el móvil.

## Accessibility & Inclusion

Contraste AA, foco visible, navegación por teclado, objetivos táctiles cómodos y respeto de `prefers-reduced-motion` y del ajuste «Animaciones suaves» de la app.
