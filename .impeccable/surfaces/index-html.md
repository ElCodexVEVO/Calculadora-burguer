---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["DEMO_V6.html","DEMO_ACCESO.html"]
---

# Burger Shot · punto de venta (index.html, DEMO_V6.html, DEMO_ACCESO.html)

Mode: Operate. Build path: code-led (Operate surface).

Alcance: rediseño visual completo de toda la app (acceso, carga, resumen, caja, caja auxiliar, perfil, ventas, estadísticas, equipo, clientes, promociones, ajustes, modales). Se conservan funciones, datos, cálculos, permisos, nombre y logo aprobado. Arte: fotos de menú entregadas por el usuario (assets/menu-fotos) para el catálogo; ilustración vectorial propia para escenas, estados vacíos y productos sin foto.

Petición del usuario (7 nov 2026): "rediseño visual completo… senior illustrator y designer, profesional, animaciones". Eligió Candy Kustom con la condición explícita: "recordemos que es para Burger Shot". La marca manda; lo lowrider es acabado.

## Direction contract

THESIS: Burger Shot como el autoservicio donde los lowriders de Los Santos llegan en noche de crucero. La caja se pinta en candy rojo Burger Shot y oro mostaza, con fileteado y cromo como acabado; el total vive en una placa de club. Rechaza el panel negro con neón genérico y la caja blanca de SaaS.

OWN-WORLD: Paleta medida en las fotos de menú del negocio: negro rojizo del local #140706, paneles #250f0c, rojo de empaque Burger Shot #d61a1f, ámbar del logo #ffb526 y crema del papel #fff4ec; un solo punto dorado marca la sección activa. Riel lateral en rojo candy con metalflake; filete dorado en cabeceras; placa del total y del empleado de la semana como caja Burger Shot (rojo con franjas blancas diagonales); ticket claro como papel de envoltura con el emblema repetido. Fotos reales del menú en el catálogo; ilustración kustom propia (tinta gruesa, candy plano) solo donde no hay foto y en las escenas. Barlow y Barlow Condensed para operar, Grenze Gotisch en placas, Yellowtail como firma.

STORY: El cajero ve el menú ilustrado, agrega y el ticket crece; el total cambia al instante y su placa da un salto hidráulico; cobra con el botón oro sin buscar. El gerente lee el ranking como una fila de crucero que se reordena en su sitio.

FIRST VIEWPORT: Caja 1440×900: riel rojo de ~248 px (logo, Operación/Gestión, cuenta abajo); barra superior con búsqueda, hora y usuario; título "Arma el pedido" con filete; pestañas; rejilla de tarjetas con ilustración sobre disco candy, precio oro tabular y Agregar; ticket derecho de ~380 px con placa roja cromada del total y botón oro. Resumen: saludo y hora, banner ilustrado de noche de crucero con el lowrider Burger Shot, cifras grandes sin caja, ranking y placa del empleado.

FORM: Candy Kustom, candidato 5 de la lista ordenada (rótulo de puesto, póster de carga de GTA, lotería, empaque de comida rápida, lowrider candy y filete, volante de ofertas, menú de drive-in); semilla 65a7ba4d. Movimiento firma: salto hidráulico de la placa del total y de la tarjeta agregada; brillo candy que sigue al cursor; filete que se dibuja al entrar; ranking que se reordena con FLIP.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Raises (de los retadores declinados)

- Manual de acetato: la sección activa se marca con placa de cromo y punto dorado (el usuario pidió una paleta armónica; se retiró el color por sección).
- Campo de datos: todas las cifras tabulares en una sola voz, alineadas por columna.
- Horario de bolsillo: rango por peso, mayúsculas y reverso; una sola placa invertida por pantalla (el total).
- Muro de streaming: al cobrar, el resto se atenúa y la revisión toma el centro.
- Mosaicos: métricas clave sin caja, cifras grandes sobre el fondo.

## Restricciones

Sin compilación; movimiento reducido, modo Rendimiento (`body.motion-off`) y pestaña oculta detienen efectos. Los importes nunca se animan ni se retrasan. Contraste AA, foco visible, nombres accesibles.

## Decisiones posteriores (7 nov 2026)

- El usuario rechazó el petróleo con acentos múltiples por falta de armonía y eligió la paleta B · Cálido diner (comparativa en design/kustom/paletas.html).
- Pidió más animación: entradas de pantalla, caja más viva, escenas e ilustraciones y microinteracciones. Todas respetan movimiento reducido, modo Rendimiento y pestaña oculta.
- El usuario entregó 12 fotos de menú Burger Shot y pidió usarlas y que la página haga juego con ellas: la paleta pasó del espresso a los colores medidos en las fotos.
- Pidió subir el resultado a GitHub (ElCodexVEVO/Calculadora-burguer) al final; se sube en rama propia con Pull Request porque main publica en GitHub Pages.
