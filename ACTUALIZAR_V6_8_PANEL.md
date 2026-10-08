# Actualizar el panel a V6.8

El inicio aplica la propuesta aprobada: banner compacto con **Ir a caja**, cuatro indicadores con iconos y cifras más legibles, reconocimiento del empleado junto al rendimiento del equipo y gráfico semanal a todo el ancho. Se retiró Cliente de la semana del inicio; las fichas y el historial de clientes siguen disponibles en sus secciones.

El ranking muestra hasta cinco empleados según las ventas activas de la semana; permite desplazarse si hay más filas que espacio. El gráfico corresponde al empleado destacado y lo identifica junto a las fechas. La selección manual de empleado, su foto y el ticket promedio siguen disponibles. Un día sin ventas muestra $0 y un marcador de base, sin una barra de ventas ficticia.

## Archivos

Sobre V6.7, reemplaza `index.html`, `app.js` y `v6-modules.js` y añade `dashboard.css` y `dashboard.js`. Para las vistas de ejemplo reemplaza también `DEMO_V6.html` y `DEMO_ACCESO.html`. Incluye los estilos, scripts e imágenes de la versión anterior. Conserva tu `config.js`.

No hay cambios de base de datos ni migraciones nuevas. GitHub Pages publica el cambio cuando el pull request se integra en `main`. Los archivos modificados llevan parámetros de versión V6.8 para renovar la caché del navegador.

## Movimiento y accesibilidad

Las barras entran de forma suave al abrir Inicio y cuando cambian sus datos. Los importes hacen una transición breve cuando se actualizan; su texto siempre conserva el importe calculado. El gráfico se consulta con clic, Enter o la barra espaciadora y anuncia fecha e importe. Los efectos respetan movimiento reducido y el ajuste de animaciones de la app.

## Verificación

Pruebas locales con Supabase simulado y PostgreSQL/PGlite. El panel se revisó en 320, 360, 390, 560, 768, 980, 1120, 1440 y 1720 px, con estados sin ventas, selección manual y permisos de cajero. Resultados: `tests/dashboard-browser-results.json`. Capturas reales: `preview/panel-v6-8-escritorio.png` y `preview/panel-v6-8-movil.png`.
