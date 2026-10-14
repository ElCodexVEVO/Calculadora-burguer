# Validación V7.8

Corte documental: 13 de octubre de 2026. Rama `codex/cinematic-profiles`. Esta validación corresponde a la nueva referencia visual y a las mejoras de perfil, barra compacta y caja auxiliar.

## Pruebas automatizadas

La ejecución final de `npm test` en `tests/` terminó correctamente con **182 escenarios PASS**. Evidencia local: `../../.visual-review/v7-8-tests.log` desde este documento. Incluye cálculo, ventas, precios, convenios, promociones, comisiones, pagos, edición, permisos, clientes, reportes, auditoría y regresiones de perfiles.

Las pruebas de perfiles cubren datos propios, filtros de periodo, recorte, preferencia local/remota, avatar compartido, limpieza al cerrar sesión, indisponibilidad del backend, validación de redes, eliminación de una red, errores y cambio de sesión. Los tests de SQL cubren RLS, RPC propias, rechazo de escritura ajena, bucket privado y persistencia. El nuevo escenario de caja auxiliar comprueba que el cliente pueda completarse al cobrar y sea obligatorio al registrar.

El procesamiento fotográfico completo (JWT, MIME, tamaño, dimensiones, recodificación, reemplazo, conflicto, eliminación y limpieza) se prueba con Auth y Storage simulados. Esa cobertura no acredita un ciclo fotográfico autenticado real.

Ambas demos se regeneraron desde `index.html` y usan el backend simulado. Sus estadísticas y usuarios son datos de ejemplo; no se copiaron a Supabase.

## Evidencia visual

Las diez capturas finales están versionadas en [screenshots/v7-8](screenshots/v7-8/README.md), con origen, viewport CSS y bitmap en sidecars JSON. Se recapturaron después de los dos ajustes de revisión, con CSS 7.8.4: encabezado de perfil alineado al inicio entre 601 y 980 px, y textos funcionales señalados ampliados de 10 a 11 px. Son capturas reales de DEMO_V6.html con datos simulados, tomadas el 13 de octubre de 2026.

| Vista | Viewport CSS | Bitmap | Origen |
| --- | --- | --- | --- |
| [Inicio · escritorio](screenshots/v7-8/final-dashboard-desktop.jpg) | 1240 × 900 | 1230 × 893 | [Sidecar](screenshots/v7-8/final-dashboard-desktop.jpg.json) |
| [Sidebar compacta · escritorio](screenshots/v7-8/final-sidebar-compact.jpg) | 1240 × 900 | 1230 × 893 | [Sidecar](screenshots/v7-8/final-sidebar-compact.jpg.json) |
| [Mi perfil · escritorio](screenshots/v7-8/final-profile-desktop.jpg) | 1240 × 900 | 1230 × 893 | [Sidecar](screenshots/v7-8/final-profile-desktop.jpg.json) |
| [Caja auxiliar · escritorio](screenshots/v7-8/final-aux-desktop.jpg) | 1240 × 900 | 1240 × 900 | [Sidecar](screenshots/v7-8/final-aux-desktop.jpg.json) |
| [Revisión de cobro · escritorio](screenshots/v7-8/final-aux-checkout.jpg) | 1240 × 900 | 1240 × 900 | [Sidecar](screenshots/v7-8/final-aux-checkout.jpg.json) |
| [Inicio · móvil](screenshots/v7-8/final-dashboard-mobile.jpg) | 390 × 844 | 380 × 822 | [Sidecar](screenshots/v7-8/final-dashboard-mobile.jpg.json) |
| [Mi perfil · móvil](screenshots/v7-8/final-profile-mobile.jpg) | 390 × 844 | 380 × 822 | [Sidecar](screenshots/v7-8/final-profile-mobile.jpg.json) |
| [Revisión de cobro · móvil](screenshots/v7-8/final-aux-checkout-mobile.jpg) | 390 × 844 | 380 × 822 | [Sidecar](screenshots/v7-8/final-aux-checkout-mobile.jpg.json) |
| [Mi perfil · tablet](screenshots/v7-8/final-profile-tablet.jpg) | 820 × 1000 | 810 × 988 | [Sidecar](screenshots/v7-8/final-profile-tablet.jpg.json) |
| [Caja auxiliar · tablet](screenshots/v7-8/final-aux-tablet.jpg) | 820 × 1000 | 810 × 988 | [Sidecar](screenshots/v7-8/final-aux-tablet.jpg.json) |

El proveedor reduce ligeramente algunos bitmaps; las imágenes contienen la ventana completa. Las capturas antiguas `cinematic-*` y `reference-*` no acreditan el estado final V7.8. El barrido de procedencia final registró 125 rasters y 0 registros de origen ausentes.

A 1672 × 941 se comprobó geometría DOM: héroe en x307/y169, altura 255 px, y actividad semanal desde y774. Son mediciones de disposición; la limitación física de captura impide afirmar fidelidad visual por screenshot a 1672 px. La referencia pide héroe alrededor de y167 y actividad desde y772. Los datos y nombres reales o simulados del producto sustituyen los del ejemplo.

La revisión independiente completa confirmó las firmas de tipografía y material, la composición, navegación, banner, métricas, perfil, auxiliar y las adaptaciones declaradas. Su resultado pidió dos ajustes: alinear el encabezado de perfil al inicio en el rango intermedio y ampliar los textos funcionales señalados.

Ambos ajustes se implementaron y se recapturó la matriz de diez vistas con CSS 7.8.4. La revisión de confirmación terminó con **VERDICT PASS — `disposition: ship`**, ambos puntos **RESUELTOS** y sin regresiones visibles en las diez recapturas. Este veredicto puntúa esos dos ajustes; no constituye aprobación universal del producto ni comparación pixel a pixel con la referencia a 1672 × 941. El `ship` antiguo de la dirección sobria quedó invalidado por el rechazo del usuario y no se usa como evidencia de esta entrega.

## Comprobaciones cloud reales

Proyecto `kvcshkzmsbcllplebvpm`. El backend de fotografía/efectos y `supabase_patch_v7_8_socials.sql` ya se aplicaron tras autorización explícita del usuario.

- `employee_appearance` tiene RLS, publicación Realtime y bucket privado de avatares.
- La función fotográfica desplegada respondió OPTIONS 200 y rechazó solicitudes anónimas/JWT inválidos con 401.
- La RPC de efectos propia se verificó mediante transacción revertida.
- La RPC de redes propia guardó/leyó valores bajo rol authenticated en una transacción real revertida. Se rechazaron otro usuario y un identificador inseguro; el rol anónimo no tiene ejecución.
- Las huellas antes/después de la activación de redes coincidieron: **198 ventas, 12 perfiles, 6 cortes** y todos los valores existentes de foto/efectos. Esta comparación cubre los registros completos financieros y de perfiles, no solo sus conteos. No quedaron usuarios de redes de QA persistidos.

El despliegue previo de fotos/efectos conservó entonces 187 ventas y 12 perfiles; esa cifra pertenece a su corte histórico. La comparación de 198 ventas es la evidencia posterior del parche de redes.

## Límites

No se probó el ciclo completo de foto en producción ni en dos dispositivos con sesiones reales. No se crearon cuentas, cambiaron contraseñas ni guardaron fotos de empleados para suplir esa comprobación. La RPC de redes tiene comprobación cloud real; el flujo de navegador entre dispositivos permanece sin probar.

No hay OCR activo ni campo/validación de importe recibido en la caja auxiliar actual. Los helpers históricos sin uso no representan una capacidad disponible. La ventana Electron/FiveM real y un instalador nuevo no forman parte de estas pruebas.

El backend está activado. V7.7 ya se integró en `main` mediante [PR #11](https://github.com/ElCodexVEVO/Calculadora-burguer/pull/11), merge `855d992160553cea82938f7b26b0620901645b04`. V7.8 sigue local en `codex/cinematic-profiles`, pendiente de un PR nuevo y de integración/publicación. Detalles en [PROFILE_DEPLOYMENT.md](PROFILE_DEPLOYMENT.md).
