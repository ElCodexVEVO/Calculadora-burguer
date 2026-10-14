# Burger Shot V7.8 · Ofrenda nocturna y perfiles

Punto de venta HTML/CSS/JavaScript para Burger Shot en FiveM, con Supabase. El inicio reproduce la referencia elegida por el usuario: paneles negros y vino, filigrana roja luminosa, banner fotográfico, logo aprobado grande, papel picado diagonal, Fraunces en titulares y Figtree en controles.

V7.7 ya se integró en `main` mediante [PR #11](https://github.com/ElCodexVEVO/Calculadora-burguer/pull/11), merge `855d992160553cea82938f7b26b0620901645b04`. V7.8 está subida en `codex/cinematic-profiles` y [PR #12 en borrador](https://github.com/ElCodexVEVO/Calculadora-burguer/pull/12), todavía sin integrar en `main` ni publicar en GitHub Pages. El backend de fotos, efectos y redes está activado. La revisión completa pidió dos ajustes; ambos están resueltos y su confirmación final es `disposition: ship`. El veredicto cubre esos ajustes y las diez recapturas, sin afirmar coincidencia visual a 1672 px.

## Cambios actuales

- Sidebar de 290/260 px y carril plegado de 76 px, con acceso directo a Mi perfil, ayudas por icono y cajón móvil.
- Mi perfil con identidad, foto privada, iniciales de respaldo, historial y cuatro métricas propias bajo Esta semana / Total: ventas activas, total vendido, comisiones y ticket promedio. Se excluyen ventas anuladas y ajenas.
- Instagram, Discord, TikTok y Twitch opcionales, guardados en la cuenta propia. Enlaces seguros y copia del usuario de Discord.
- Editor fotográfico con recorte, zoom, reposición, vista circular, guardado, reemplazo y eliminación.
- Cinematográfico, Equilibrado y Rendimiento con persistencia por cuenta y soporte de movimiento reducido.
- Caja auxiliar amplia con catálogo y ticket lateral; ventana compacta conservada. Cobro en una columna con resumen, cliente, método, nota y confirmación del pago. Cliente opcional al preparar y obligatorio al registrar.
- Los cálculos, precios, convenios, promociones, comisiones, roles, reportes, auditoría y avisos de Discord se conservan.

La caja auxiliar actual no incluye OCR ni un campo de importe recibido. Los recursos y helpers OCR históricos permanecen sin uso; las notas antiguas no describen una capacidad activa.

## Probar en local

Desde la carpeta que contiene `index.html`:

```powershell
py -m http.server 8002 --bind 127.0.0.1
```

Abrir [demo del inicio](http://127.0.0.1:8002/DEMO_V6.html) o [demo de acceso](http://127.0.0.1:8002/DEMO_ACCESO.html). Usuario y contraseña: `demo`. Ambas usan datos simulados y no contactan con Supabase.

[La aplicación](http://127.0.0.1:8002/index.html) usa el Supabase configurado. Conservar `config.js` al actualizar; no incluir claves de servicio en el navegador.

## Verificación

```powershell
node demo/build-demos.cjs
cd tests
npm ci
npm test
```

La ejecución final supera **182 escenarios**. El backend real de redes se comprobó mediante una transacción autenticada revertida y sin cambios en las huellas de 198 ventas, 12 perfiles, 6 cortes y los valores anteriores de foto/efectos. No se probó el ciclo fotográfico real ni la sincronización entre dos dispositivos. No se generó un instalador Electron nuevo.

Las [diez capturas finales versionadas](docs/screenshots/v7-8/README.md) cubren escritorio 1240 × 900, móvil 390 × 844 y tablet 820 × 1000. Sus sidecars registran origen y tamaño real del bitmap. A 1672 × 941 se verificó geometría DOM; no se afirma comparación visual por screenshot a ese tamaño. El antiguo veredicto visual no cubre esta sustitución.

## Documentación vigente

- [Entrega y archivos](docs/CINEMATIC_DELIVERY.md)
- [Pruebas y límites](docs/CINEMATIC_QA.md)
- [Backend activado y comprobaciones cloud](docs/PROFILE_DEPLOYMENT.md)
- [Dirección visual](docs/CINEMATIC_DIRECTION.md)
- [Mapa de fidelidad de la referencia](docs/REFERENCE_FIDELITY.md)
- [Sistema visual y tokens](DESIGN.md)
- [Contexto de producto](PRODUCT.md)
- [Capturas y procedencia](docs/screenshots/v7-8/README.md)
- [Prompt maestro para continuar con Claude](docs/CLAUDE_MASTER_PROMPT.md), con inventario de 63 archivos SKILL reales y respaldo mediante capturas versionadas

La cascada final está en `reference-dashboard.css`, después de `cinematic.css`. Los tres nuevos WebP de `assets/season/` conservan prompts exactos en sidecars. Fraunces se sirve localmente y su licencia está en `assets/fonts/Fraunces-OFL.txt`.

## Instalación y configuración

Si la aplicación ya funciona, conservar `config.js`, sus datos y los secretos de Edge. El proyecto real de esta entrega ya tiene activados `supabase_patch_v7_7_appearance.sql`, `profile-photo` y `supabase_patch_v7_8_socials.sql`; no volver a ejecutar toda la historia para actualizar la interfaz.

Para una instalación nueva, partir de [LEEME_V6.md](LEEME_V6.md), [ACTUALIZAR_V7.md](ACTUALIZAR_V7.md) y los parches necesarios para ese estado de base. Los documentos históricos explican sus respectivas migraciones; los contratos actuales de perfil están en [PROFILE_DEPLOYMENT.md](docs/PROFILE_DEPLOYMENT.md).

`config.js` contiene la URL y clave pública publishable/anon. Las claves service role y webhooks de Discord quedan solo en secretos de Supabase. La aplicación conserva `employee-admin` para administración y `discord-notify` para notificaciones.

El sitio es estático y no necesita compilación. `desktop/` conserva el empaquetado Electron existente. Las reglas financieras y permisos se aplican también en el backend.

## Notas históricas

Las guías `ACTUALIZAR_*.md` y `VERIFICACION*.md` conservan el detalle de versiones anteriores. Sus recuentos de pruebas, capturas, apariencia y descripción de OCR pertenecen a esas versiones. Para V7.8, prevalecen los documentos vigentes enlazados arriba.
