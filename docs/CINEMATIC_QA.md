# Validación V7.7

12 de octubre de 2026. Rama `codex/cinematic-profiles`.

- `npm test` en `tests`: **170 comprobaciones superadas**. Las 139 existentes cubren ventas, precios, convenios, comisiones, pagos, edición, permisos, clientes, promociones, reportes y auditoría. Se añadieron 31 comprobaciones de perfiles, recorte, preferencias, JWT, validación JPEG y RLS.
- `node demo/build-demos.cjs`: genera las dos vistas previas desde el HTML de producción; no incluye el cliente real de Supabase en las demos.
- `node --check`: scripts modificados válidos. El TypeScript de Edge se ejecutó en una prueba local con Auth/Storage simulados y decodificación JPEG real.
- Navegador: acceso incorrecto con error y acceso correcto con transición al dashboard; carga/recorte/zoom/reposición/guardado/eliminación de foto en demo; actualización de avatar compartido; modos visuales; navegación móvil y barra compacta con persistencia. Las pruebas no alteraron usuarios ni fotos reales. La consola de las vistas inspeccionadas no mostró errores ni advertencias.
- Vistas móvil 390 px, intermedia 735 px, tablet 820 px y escritorio 1280 px: sin desbordamiento horizontal en las superficies inspeccionadas. Búsqueda desplegable comprobada también a 735 px. Los motivos decorativos no reciben clics; las tablas mantienen desplazamiento propio.
- Movimiento reducido: CSS desactiva bucles y transiciones; los módulos existentes también consultan la preferencia del sistema. Rendimiento desactiva partículas y parallax. Los bucles se pausan con la pestaña oculta.
- Arte nuevo: restaurante nocturno WebP, 267 KB y variante 960 px de 112 KB antes de metadatos. Logo aprobado conservado. Procedencia registrada para los 112 recursos raster existentes/nuevos; las 32 imágenes preexistentes modificadas solo recibieron metadatos de origen y conservaron exactamente sus píxeles decodificados.
- Detector de diseño: avisos heredados en contenedores de la página antigua (`panel`, `clock-card`, `pos-session`); comprobación visual de los elementos nuevos independiente de esos avisos. No se alteraron cálculos para cumplir avisos visuales.
- Revisión independiente: `disposition: ship` para el código y diseño inspeccionados. La primera evidencia de escritorio se descartó por capturas durante desplazamientos/transiciones; se sustituyó por vistas estables verificando `main.left === sidebar.right` a 252 y 76 px. El veredicto no acredita despliegue cloud.

## Límites de esta validación

**Supabase de producción no se ha actualizado.** La consulta de solo lectura identificó el proyecto y la ausencia de la tabla nueva. La revisión automática rechazó ejecutar la migración sin aprobación explícita. La validación de Storage, políticas y preferencias entre dispositivos se hizo con SQL local/PGlite y servicios simulados, no con cuentas reales.

Los perfiles muestran únicamente datos ya disponibles: no inventan fechas de incorporación, premios ni ventas. El reconocimiento actual de administración se muestra si existe; el histórico de reconocimientos no forma parte del esquema actual. Electron conserva su empaquetado existente; no se generó un instalador Windows nuevo.

Activación y comprobación cloud: [PROFILE_DEPLOYMENT.md](PROFILE_DEPLOYMENT.md).
