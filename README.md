# Burger Shot V7.8 · Ofrenda nocturna y perfiles

Punto de venta HTML/CSS/JavaScript para Burger Shot en FiveM, con Supabase. El inicio reproduce la referencia elegida por el usuario: paneles negros y vino, filigrana roja luminosa, banner fotográfico, logo aprobado grande, papel picado diagonal, Fraunces en titulares y Figtree en controles.

V7.7 ya se integró en `main` mediante [PR #11](https://github.com/ElCodexVEVO/Calculadora-burguer/pull/11), merge `855d992160553cea82938f7b26b0620901645b04`. V7.8 está subida en `codex/cinematic-profiles` y [PR #12 en borrador](https://github.com/ElCodexVEVO/Calculadora-burguer/pull/12), todavía sin integrar en `main` ni publicar en GitHub Pages. El backend de fotos, efectos y redes está activado. La revisión completa pidió dos ajustes; ambos están resueltos y su confirmación final es `disposition: ship`. El veredicto cubre esos ajustes y las diez recapturas, sin afirmar coincidencia visual a 1672 px.

## Restaurante 3D (página principal)

Tras iniciar sesión se reproduce la entrada al local (fachada → puertas → interior isométrico) y el restaurante queda como página principal: mostrador conectado a la calculadora existente, personajes 3D de las personas conectadas con su actividad («Tomando pedido», «Entregando comida») mediante Supabase Realtime Presence y acceso a todas las secciones. Sin WebGL se usa una vista 2D con las mismas funciones. Detalle, pruebas y riesgos en [docs/RESTAURANTE_3D.md](docs/RESTAURANTE_3D.md). Para ver dos sesiones en la demo, abre `DEMO_V6.html?demoUser=cashier-1` en otra pestaña.

## Cambios actuales

- Sidebar de 290/260 px y carril plegado de 76 px, con acceso directo a Mi perfil, ayudas por icono y cajón móvil.
- Mi perfil con identidad, foto privada, iniciales de respaldo, historial y cuatro métricas propias bajo Esta semana / Total: ventas activas, total vendido, comisiones y ticket promedio. Se excluyen ventas anuladas y ajenas.
- Instagram, Discord, TikTok y Twitch opcionales, guardados en la cuenta propia. Enlaces seguros y copia del usuario de Discord.
- Editor fotográfico con recorte, zoom, reposición, vista circular, guardado, reemplazo y eliminación.
- Cinematográfico, Equilibrado y Rendimiento con persistencia por cuenta y soporte de movimiento reducido.
- Caja auxiliar amplia con catálogo y ticket lateral; ventana compacta conservada. Cobro en una columna con resumen, cliente, método, nota y confirmación del pago. Cliente opcional al preparar y obligatorio al registrar.
- Los cálculos, precios, convenios, promociones, comisiones, roles, reportes, auditoría y avisos de Discord se conservan.

La caja auxiliar actual no incluye OCR ni un campo de importe recibido. Los recursos y helpers OCR históricos permanecen sin uso; las notas antiguas no describen una capacidad activa.
