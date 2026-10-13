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

**Supabase de producción se actualizó después de la autorización explícita del usuario.** La migración y la función se desplegaron correctamente. Verificación real: RLS activado, bucket privado de 512 KB, RPC de preferencias permitida para miembros y commit de fotografía denegado a clientes; tabla incluida en Realtime. La API respondió OPTIONS 200 y rechazó solicitudes anónimas/JWT inválidos con 401. Una transacción revertida comprobó guardar/leer la preferencia propia y rechazar modos no admitidos, sin persistir cambios en cuentas reales. Las 187 ventas y los 12 perfiles, así como los totales de ventas y comisiones, coincidieron antes y después del despliegue.

No se ejecutó el ciclo fotográfico autenticado en producción ni en dos dispositivos: no se disponía de sesiones de prueba reales. Los tests de procesamiento, reemplazo, eliminación, conflictos y Storage completo usan servicios simulados; no acreditan esa comprobación pendiente. La revisión visual `ship` antecede al despliegue y no se presenta como certificación cloud.

Los perfiles muestran únicamente datos ya disponibles: no inventan fechas de incorporación, premios ni ventas. El reconocimiento actual de administración se muestra si existe; el histórico de reconocimientos no forma parte del esquema actual. Electron conserva su empaquetado existente; no se generó un instalador Windows nuevo.

Activación y comprobación cloud: [PROFILE_DEPLOYMENT.md](PROFILE_DEPLOYMENT.md).
