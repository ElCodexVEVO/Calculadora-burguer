# Entrega V7.8 · Burger Shot

La rama `codex/cinematic-profiles` reproduce el dashboard elegido por el usuario y amplía Mi perfil, la barra compacta y la caja auxiliar. Conserva las reglas del punto de venta, precios, convenios, promociones, comisiones, permisos, reportes, auditoría e integraciones.

## Resultado

- Inicio con entorno nocturno de ofrenda, banner fotográfico, paneles negros y vino, filigrana roja luminosa, logo aprobado grande y papel picado diagonal. Vollkorn en titulares e importes destacados; Archivo en controles.
- Sidebar de 290/260 px y carril de 76 px, con acceso directo a Mi perfil, ayudas por icono y cajón móvil.
- Mi perfil con foto privada, iniciales de respaldo, datos propios, cuatro indicadores coherentes bajo Esta semana / Total y actividad reciente.
- Instagram, Discord, TikTok y Twitch opcionales, editables únicamente por su cuenta. Enlaces HTTPS normalizados y copia del usuario de Discord.
- Editor de foto con recorte, zoom, reposición, vista circular, guardado y eliminación; tres modos visuales con preferencia por cuenta.
- Caja auxiliar amplia con catálogo y ticket lateral; ventana compacta conservada. Cobro en una columna con resumen, cliente, pago, nota y casilla de confirmación. Cliente obligatorio al registrar. Sin OCR ni importe recibido en la interfaz actual.

La confirmación de venta llega después del servidor y los efectos conservan los importes reales. Rendimiento y movimiento reducido detienen los efectos correspondientes; la pestaña oculta pausa los bucles.

## Recursos y archivos

| Área | Fuente |
| --- | --- |
| Marco final | `reference-dashboard.css`, `cinematic.css`, `sidebar.js`, `index.html` |
| Perfil y redes | `profile-core.js`, `profile.js`, `supabase_patch_v7_8_socials.sql` |
| Caja auxiliar | `companion.js`, `companion-core.js`, `companion.css` |
| Backend fotográfico | `supabase_patch_v7_7_appearance.sql`, `supabase/functions/profile-photo/index.ts` |
| Nuevo arte | `assets/season/dashboard-night.webp`, `traditions-feast.webp`, `season-altar-card.webp` y sus sidecars de prompt exacto |
| Fuente serif | `assets/fonts/Vollkorn.ttf`, `Vollkorn-OFL.txt` |
| Demos | `demo/build-demos.cjs`, `demo/mock-supabase.js`, `DEMO_V6.html`, `DEMO_ACCESO.html` |
| Sistema visual | `DESIGN.md`, `.impeccable/design.json`, `.impeccable/surfaces/index-html.md` |
| Evidencia versionada | [Diez capturas y sidecars](screenshots/v7-8/README.md) |
| Continuidad con Claude | [Prompt maestro](CLAUDE_MASTER_PROMPT.md), inventario de 63 archivos SKILL reales y respaldo de capturas versionadas |

Los tres nuevos WebP suman aproximadamente 331 KB. El restaurante del acceso y el logo aprobado se conservan. La licencia de Vollkorn y la procedencia de cada imagen están junto a los recursos.

## Ejecutar y comprobar

Desde la raíz:

```powershell
py -m http.server 8002 --bind 127.0.0.1
```

Abrir [demo de inicio](http://127.0.0.1:8002/DEMO_V6.html) o [demo de acceso](http://127.0.0.1:8002/DEMO_ACCESO.html), usuario y contraseña `demo`. `index.html` usa el Supabase configurado; conservar `config.js`.

```powershell
node demo/build-demos.cjs
cd tests
npm ci
npm test
```

La suite final supera **182 escenarios**. No se generó un instalador Electron nuevo. Evidencia y límites en [CINEMATIC_QA.md](CINEMATIC_QA.md).

## Estado de entrega

Backend de fotos, efectos y redes activado en Supabase y verificado dentro del alcance descrito en [PROFILE_DEPLOYMENT.md](PROFILE_DEPLOYMENT.md). Las huellas de 198 ventas, 12 perfiles, 6 cortes y los valores previos de foto/efectos se conservaron al activar redes.

V7.7 se integró en `main` mediante [PR #11](https://github.com/ElCodexVEVO/Calculadora-burguer/pull/11), merge `855d992160553cea82938f7b26b0620901645b04`. V7.8 está subida en `codex/cinematic-profiles` y [PR #12 en borrador](https://github.com/ElCodexVEVO/Calculadora-burguer/pull/12), todavía sin integrar en `main` ni publicar en Pages. Commit de implementación publicado: `5a91cbc41a563ebb0a7f81b5fda52e3be058ab29`. La revisión completa confirmó las firmas visuales y adaptaciones declaradas y pidió dos ajustes: encabezado del perfil alineado al inicio entre 601 y 980 px y textos funcionales señalados ampliados de 10 a 11 px. Ambos quedaron resueltos. Tras recapturar las diez vistas con CSS 7.8.4, la revisión de confirmación emitió `disposition: ship` para esos dos puntos y no encontró regresiones visibles. El alcance no es una aprobación universal del producto. El `ship` anterior no cubre esta referencia. No se afirma fidelidad de screenshot a 1672 px ni ciclo fotográfico real entre dispositivos.
