# Entrega V7.7 · Burger Shot

La rama `codex/cinematic-profiles` amplía la aplicación existente. Mantiene el punto de venta, precios, convenios, promociones, comisiones, roles, reportes, auditoría e integraciones. `main` conserva la versión estable hasta revisar e integrar la rama.

## Interfaz y componentes

- Acceso centrado sobre un restaurante nocturno nuevo, con el logotipo 3D aprobado, campos y errores reales.
- Sidebar de 252 px, carril plegado de 76 px con ayudas de texto y preferencia local; cajón móvil con control de foco.
- Encabezado con sección actual, búsqueda funcional de productos/secciones, reloj local y acceso a la cuenta. Búsqueda desplegable hasta 760 px.
- Mi perfil con identidad, estado, estadísticas propias de ventas activas por semana/mes, historial reciente y reconocimiento vigente cuando existe.
- Avatar compartido en encabezado, sidebar, cuenta, directorio, ranking y empleado de la semana. Iniciales como respaldo.
- Editor de fotografía con validación, recorte, zoom, arrastre, controles de teclado, vista circular, guardado, eliminación y recuperación ante errores.
- Tres modos de efectos: Cinematográfico, Equilibrado y Rendimiento. Preferencia local con sincronización por cuenta cuando se active Supabase.

## Movimiento y recursos

Se conserva la animación del logo y las letras del acceso, papel picado y pétalos; la nueva capa ajusta niebla/neón, entrada de métricas, tarjetas de empleados, modal, botones y avatar. Se reutilizan los gráficos y las confirmaciones de venta existentes: el éxito se presenta después de la respuesta del servidor. Los importes proceden de las ventas, sin animar ni alterar cálculos financieros.

El modo Rendimiento detiene los efectos ambientales y las transiciones; se respeta la reducción de movimiento del sistema y se pausan los bucles al ocultar la pestaña. El restaurante nuevo se entrega en WebP, con variante de 960 px. Las imágenes existentes conservan su contenido y registran su procedencia.

## Archivos principales

| Área | Archivos |
| --- | --- |
| Sistema visual y navegación | `cinematic.css`, `cinematic.js`, `sidebar.js`, `index.html` |
| Perfiles y editor | `profile-core.js`, `profile.js`, integración puntual en `app.js` |
| Acceso y ajustes | `auth-scene.js`, `v6-modules.js` |
| Backend privado | `supabase_patch_v7_7_appearance.sql`, `supabase/functions/profile-photo/index.ts` |
| Arte | `assets/restaurant-night.webp`, `assets/restaurant-night-960.webp`, metadatos/sidecars de procedencia |
| Demos | `demo/mock-supabase.js`, `demo/build-demos.cjs`, `DEMO_V6.html`, `DEMO_ACCESO.html` |
| Verificación | `tests/profile-regression.cjs`, `profile-ui.cjs`, `appearance-db.cjs`, `profile-photo-api.cjs` y dependencias de pruebas |
| Documentación | `DESIGN.md`, `.impeccable/design.json`, `PRODUCT.md`, `.impeccable/surfaces/index-html.md`, `docs/CINEMATIC_*.md`, `docs/PROFILE_DEPLOYMENT.md` |

## Ejecutar

Desde la raíz del repositorio:

```powershell
py -m http.server 8001 --bind 127.0.0.1
```

Abrir `http://127.0.0.1:8001/DEMO_V6.html` o `DEMO_ACCESO.html` (usuario `demo`, contraseña `demo`). Las demos funcionan sin conexión a producción. `index.html` utiliza la configuración real existente; conservar `config.js` al actualizar.

```powershell
node demo/build-demos.cjs
cd tests
npm ci
npm test
```

La web es estática y no requiere compilación. Se regeneraron ambas demos y pasaron 170 pruebas. No se construyó un instalador Electron nuevo. El detalle de comprobaciones y límites está en [CINEMATIC_QA.md](CINEMATIC_QA.md).

## Activación y límites

**Supabase de producción ya está actualizado**, después de la autorización explícita del usuario. Se verificaron bucket privado, RLS, permisos, preferencias propias y rechazo de solicitudes sin sesión válida, conservando los datos financieros. El frontend está publicado en [PR #11](https://github.com/ElCodexVEVO/Calculadora-burguer/pull/11); no se ha integrado en main. Falta probar el ciclo fotográfico autenticado entre dispositivos con cuentas reales. Consulta el alcance exacto y los comandos en [PROFILE_DEPLOYMENT.md](PROFILE_DEPLOYMENT.md).
