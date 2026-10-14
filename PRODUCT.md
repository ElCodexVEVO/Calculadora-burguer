# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Empleados (cajeros) y administradores de un negocio Burger Shot dentro de un servidor de roleplay de GTA V (FiveM). Cobran pedidos a otros jugadores, registran ventas y consultan su rendimiento. Usan una ventana de PC junto al juego, la aplicación Electron de `desktop/`, móvil o tableta.

## Product Purpose

Punto de venta y panel de gestión: calcular pedidos con precios, convenios, promociones y cupones; registrar la venta con cliente y método de pago; repartir comisiones; hacer cortes; y consultar ventas, estadísticas, equipo, clientes y auditoría. El éxito es cobrar rápido y sin errores de importe.

## Operating Context

Sesiones de roleplay, a menudo de noche y con el juego en primer plano. El cajero alterna entre juego y caja y copia el total al chat de FiveM. Los datos viven en Supabase (Auth, RLS, Realtime y Edge Functions). GitHub Pages toma la versión de `main`. V7.7 ya se integró mediante PR #11, merge `855d992160553cea82938f7b26b0620901645b04`. V7.8 está subida en `codex/cinematic-profiles` y [PR #12 en borrador](https://github.com/ElCodexVEVO/Calculadora-burguer/pull/12), todavía sin integrar en `main` ni publicar en GitHub Pages.

## Capabilities and Constraints

- HTML, CSS y JavaScript sin compilación; Supabase JS desde CDN. Conservar el stack y evitar dependencias grandes.
- Conservar contratos de datos, cálculos, convenios, restricciones EMS/Policía/Sheriff, promociones, cupones, permisos por rol y RLS.
- Funciones existentes: acceso por usuario o correo, administrador inicial, caja, cantidades, plantillas, caja auxiliar, cobro, edición/anulación de órdenes, ventas, estadísticas, equipo, empleado de la semana, cortes, convenios, productos, clientes frecuentes, promociones, cupones, historial, auditoría, ajustes y avisos a Discord.
- Cliente de la semana permanece en Clientes. La gráfica de actividad semanal permanece en Inicio.
- Mi perfil muestra identidad, rol, usuario público, estado y fecha de incorporación cuando existe. El selector Esta semana / Total aplica un único periodo a Ventas activas, Total vendido, Mis comisiones y Ticket promedio. Cuenta únicamente ventas activas propias; excluye anuladas y ajenas. La semana local empieza en lunes y termina antes del lunes siguiente. Total usa todo el historial propio disponible. El historial reciente identifica el estado de cada venta y muestra hasta cinco entradas del periodo.
- Redes opcionales propias: Instagram, Discord, TikTok y Twitch. Se guardan por RPC autenticada `set_my_social_links`. La interfaz normaliza usuarios y enlaces HTTPS de los dominios admitidos; el servidor recibe identificadores validados. Vaciar un campo elimina esa red. Instagram, TikTok y Twitch abren el perfil; Discord permite copiar el usuario. No se conceden permisos administrativos para editar redes ajenas.
- Fotografía privada: JPG/PNG/WebP hasta 5 MB, recorte, zoom, reposición, vista previa, guardado, reemplazo y eliminación para restaurar iniciales. El navegador genera JPEG de 512 × 512. El avatar se comparte en encabezado, sidebar, cuenta, perfil, empleados, ranking y empleado destacado.
- Cinematográfico, Equilibrado y Rendimiento se conservan localmente por empleado y se sincronizan con `employee_appearance` y `set_my_effects`. Se respeta movimiento reducido y pausa al ocultar la pestaña.
- Sidebar amplio de 290 px, 260 px en escritorio intermedio, carril plegado de 76 px con acceso directo a Mi perfil, y cajón móvil con nombres accesibles y control de foco.
- Caja auxiliar: catálogo y ticket lateral en escritorio amplio; ventana compacta conservada. El cliente puede completarse al cobrar, pero es obligatorio al registrar. La revisión muestra resumen, cliente, pago, nota y casilla de pago recibido en una columna. No hay interfaz OCR ni campo/validación de importe recibido. Los helpers y recursos OCR históricos permanecen sin uso.
- `DEMO_V6.html` y `DEMO_ACCESO.html` usan datos simulados y nunca contactan con Supabase.

## Brand Commitments

- Nombre Burger Shot; lettering BURGER SHOT integrado en el emblema aprobado.
- Temática de Día de Muertos y Halloween: cempasúchil, papel picado, velas, calaveras y calabazas.
- Negro y vino casi negro, filigrana roja luminosa, texto crema y acción naranja/dorada. La reproducción visual del dashboard elegido el 12 de octubre de 2026 sustituye la interpretación sobria rechazada.
- Logo aprobado `assets/logo/burgershot-3d.png` y variantes WebP: conservar arte, proporción, lettering y respaldos.
- Fotografías del menú en `assets/menu/`, con origen en `assets/menu/ORIGEN.json`: conservar su proporción y relación con el producto.

## Evidence on Hand

Catálogo, precios y convenios reales viven en Supabase. La demo usa `demo/mock-supabase.js` y `demo/data.js`; sus datos son simulados. No inventar estadísticas, clientes, reglas, precios, fotos ni reconocimientos.

Actualización documental: 13 de octubre de 2026. Fotografías, efectos y redes ya están activados en Supabase `kvcshkzmsbcllplebvpm`, tras autorización del usuario. Se verificaron RLS, bucket privado, RPC propias y rechazo de sesiones o escrituras no admitidas. La comprobación autenticada de redes se revirtió; las huellas de 198 ventas, 12 perfiles, 6 cortes y los valores previos de foto/efectos coincidieron antes y después. No se ejecutó el ciclo completo de fotografía real ni la sincronización entre dos dispositivos. La suite final supera 182 escenarios. La revisión independiente completa confirmó la dirección y pidió dos ajustes; ambos se corrigieron y recibieron confirmación `disposition: ship` dentro de ese alcance. El veredicto de la dirección anterior no cubre esta sustitución visual. Alcance en `docs/CINEMATIC_QA.md` y `docs/PROFILE_DEPLOYMENT.md`.

## Product Principles

1. El total es sagrado: mostrar el importe real de inmediato.
2. Operación clara dentro del marco ornamental elegido.
3. Identidad coherente entre acceso, inicio, perfil y herramientas.
4. Uso cómodo con ratón, teclado y pulgar.
5. Datos personales propios y estados vacíos honestos.

## Accessibility & Inclusion

Contraste AA como criterio de aceptación, foco visible, nombres accesibles, navegación por teclado, controles táctiles cómodos y respeto de `prefers-reduced-motion` y de las preferencias de efectos.
