---
name: Burger Shot · Candy Kustom
description: Punto de venta Burger Shot pintado como lowrider en noche de crucero; candy rojo de empaque, oro mostaza, cromo y fotos reales del menú.
colors:
  ground: "#140706"
  ground-2: "#1b0a08"
  panel: "#250f0c"
  panel-2: "#301510"
  panel-3: "#3c1c15"
  inset: "#0d0504"
  text: "#fff4ec"
  text-2: "#f2dccf"
  muted: "#d3b0a2"
  faint: "#b08c7f"
  red: "#d61a1f"
  red-hi: "#ff3d3a"
  red-deep: "#8f0c0f"
  red-ink: "#4a0506"
  box-red: "#b5110f"
  gold: "#ffb526"
  gold-hi: "#ffd36b"
  gold-deep: "#e8800c"
  gold-ink: "#2b1300"
  tangerine: "#f2661b"
  chrome: "#e7edef"
  chrome-2: "#a9b9be"
  chrome-ink: "#6e0815"
  ok: "#55dc8f"
  bad: "#ff6b6f"
  ticket-paper: "#fdf5ee"
  ticket-text: "#2a1c1d"
  ticket-text-2: "#43312f"
  ticket-muted: "#664f4a"
  ticket-faint: "#76605a"
  ticket-money: "#9f0f0e"
  ticket-ok: "#17824a"
typography:
  display:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "clamp(40px, 3.8vw, 58px)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "0.005em"
  headline:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "clamp(30px, 2.7vw, 40px)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.005em"
  title:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0.02em"
  figure:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.01em"
    fontFeature: "\"tnum\""
  total:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "clamp(38px, 3.2vw, 48px)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.01em"
    fontFeature: "\"tnum\""
  body:
    fontFamily: "Barlow, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.45
  label:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.12em"
  plaque:
    fontFamily: "Grenze Gotisch, Barlow Condensed, serif"
    fontSize: "27px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.01em"
  script:
    fontFamily: "Yellowtail, Barlow Condensed, cursive"
    fontSize: "1.22em"
    fontWeight: 400
    lineHeight: 0.8
rounded:
  xs: "8px"
  sm: "10px"
  field: "11px"
  control: "12px"
  md: "14px"
  plaque: "16px"
  lg: "20px"
  panel-xl: "24px"
  pill: "999px"
spacing:
  2xs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "22px"
  xl: "34px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.gold-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "42px"
  button-checkout:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.gold-ink}"
    rounded: "{rounded.md}"
    height: "56px"
  button-secondary:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    height: "42px"
  button-secondary-hover:
    backgroundColor: "{colors.panel-3}"
  button-disabled:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.faint}"
  chip:
    textColor: "{colors.text-2}"
    rounded: "{rounded.pill}"
    height: "38px"
  chip-selected:
    backgroundColor: "{colors.chrome}"
    textColor: "{colors.chrome-ink}"
    rounded: "{rounded.pill}"
  input:
    backgroundColor: "{colors.inset}"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
  card-product:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "14px 16px 16px"
  panel:
    backgroundColor: "{colors.panel-2}"
    rounded: "{rounded.lg}"
  nav-item-active:
    backgroundColor: "{colors.chrome}"
    textColor: "{colors.chrome-ink}"
    rounded: "{rounded.control}"
  plaque-total:
    backgroundColor: "{colors.box-red}"
    textColor: "{colors.text}"
    typography: "{typography.total}"
    rounded: "{rounded.plaque}"
    padding: "14px 40px 14px 18px"
  ticket-light:
    backgroundColor: "{colors.ticket-paper}"
    textColor: "{colors.ticket-text}"
    rounded: "{rounded.panel-xl}"
  badge:
    rounded: "{rounded.pill}"
    padding: "6px 9px"
---

# Design System: Burger Shot · Candy Kustom

## Overview

**Creative North Star: "El autoservicio en noche de crucero"**

Burger Shot es la marca y lo lowrider es el acabado. La caja vive en el negro rojizo del local que se ve en las fotos del menú; el riel lateral es una carrocería candy roja con metalflake y moldura de cromo; el oro mostaza del logo es la única voz de acción y de dinero; el cromo blanco marca lo seleccionado. El empaque rojo de Burger Shot, con sus franjas blancas en diagonal, se reserva para lo que importa: el total, la barra móvil "Ver pedido" y la ficha del empleado de la semana.

La densidad es de herramienta de trabajo: Barlow para operar, Barlow Condensed en mayúsculas para títulos y cifras, y dos voces rotuladas usadas con medida (Grenze Gotisch en placas de club, Yellowtail como firma). Las fotos reales del menú mandan en el catálogo; la ilustración propia (tinta gruesa, candy plano, brillo cromado) solo cubre lo que no tiene foto y las escenas de noche de crucero. El movimiento es de hidráulico: saltos cortos, rodadas, filetes que se dibujan; nunca toca un importe.

Rechazos confirmados: el panel negro con neón genérico (el neón heredado se convirtió en sombra de rótulo pintado) y la caja blanca de SaaS. El color por sección se retiró a petición del usuario: todo punto de sección es oro.

**Key Characteristics:**
- Fondo negro rojizo con dos luces de ambiente (rojo de letrero arriba, mandarina abajo) y metalflake tenue.
- Vocabulario de estado fijo: cromo = seleccionado, oro = acción y dinero, rojo = marca y placa del total, verde solo para estado en línea y confirmaciones.
- Placas de empaque Burger Shot (rojo con franjas blancas diagonales en SVG) para total, barra móvil y empleado de la semana.
- Filete dorado bajo títulos de página y cabeceras del resumen.
- Cifras tabulares en Barlow Condensed 800; precios en oro.
- Fotos reales a sangre en el catálogo; ilustración kustom solo como respaldo.

## Colors

Paleta medida en las fotos de menú del negocio: tierra rojiza muy oscura, rojo de empaque, ámbar del logo y crema de papel, con cromo frío como único contrapunto.

### Primary
- **Rojo de empaque Burger Shot** (red): marca. Punto del contador del pedido, insignia de cantidad en la tarjeta, aro del avatar, marcas del mapa 3D, base del riel lateral (degradado #c8171b → #9c0e10 → #6c0808). Nunca es fondo de botón de acción.
- **Rojo de caja** (box-red): cuerpo de las placas de empaque (degradado #e01f1f → box-red → #8c0b0b) y texto del contador sobre crema en la barra móvil.
- **Rojo letrero** (red-hi): barra seleccionada de la gráfica semanal y equivalentes del neón heredado.
- **Rojo hondo / tinta roja** (red-deep, red-ink): sombras de rótulo bajo texto sobre rojo y bajo el total.

### Secondary
- **Oro mostaza** (gold): acción principal (degradado gold-hi → gold → gold-deep, borde #b87400), precios, hora, cifras de dinero, foco (`outline 2px`), filete, caret y `accent-color`.
- **Oro claro** (gold-hi): realces de cifra (último KPI del empleado, total del bs-shell, comisión).
- **Oro tostado** (gold-deep): parte baja del degradado del botón.
- **Tinta de oro** (gold-ink): texto sobre oro.

### Tertiary
- **Mandarina** (tangerine): solo en degradados de datos (barras de actividad, pista del ranking rojo → mandarina → oro), luz ambiente inferior y disco de algunas ilustraciones.
- **Cromo** (chrome, chrome-2): seleccionado. Pestañas, chips y elemento activo del riel en degradado #ffffff → #d5dfe2 con texto **tinta de cromo** (chrome-ink); molduras del riel y del avatar; rejilla de gráficas al 16 %.

### Neutral
- **Negro del local** (ground) y **segundo fondo** (ground-2): lienzo de la app; escenas y acceso usan #120605.
- **Paneles** (panel, panel-2, panel-3): superficies de tres alturas; los paneles se pintan en degradado rgba(48,20,15,.92) → rgba(33,13,10,.94).
- **Hundido** (inset): campos, búsqueda, selectores segmentados.
- **Crema de papel** (text), **crema 2** (text-2), **apagado** (muted), **tenue** (faint): jerarquía de texto. Ningún texto funcional baja de faint.
- **Líneas**: rgba(255,214,196,.10 / .17 / .28) para divisor, borde y borde fuerte.
- **Estado**: ok (#55dc8f) para "Sistema en línea", sesión activa y confirmaciones; bad (#ff6b6f) para peligro y error.

### Ticket claro
Al alternar el ticket a claro, el panel reasigna sus propios tokens: papel (ticket-paper) con el emblema repetido muy tenue arriba, texto ticket-text / ticket-text-2 / ticket-muted / ticket-faint, dinero en ticket-money y confirmación en ticket-ok. Es la única superficie clara.

### Named Rules
**The Cuatro Voces Rule.** Cromo = seleccionado; oro = acción y dinero; rojo = marca y placa del total; verde solo para el punto "Sistema en línea", la sesión y las confirmaciones. Un mismo color no cambia de significado entre pantallas.

**The Un Solo Oro Rule.** Los puntos de sección del riel son todos oro; no se reintroduce color por sección.

**The Rojo No Es Acción Rule.** Los botones de acción son oro; el rojo pinta marca y placas, nunca un botón de cobrar o agregar.

## Typography

**Display Font:** Barlow Condensed (con Barlow, system-ui)
**Body Font:** Barlow (con system-ui, Segoe UI, Roboto)
**Rótulos:** Grenze Gotisch (placas de club) y Yellowtail (firma)

**Character:** Barlow viene de la señalética de carreteras y matrículas de California; condensada y en mayúsculas da la voz de rótulo de puesto. Las dos rotuladas son acabado de carrocería, no voz de interfaz.

### Hierarchy
- **Display** (800, clamp(40px,3.8vw,58px), 0.92, mayúsculas): titular del banner de inicio y de acceso (hasta 64px en acceso).
- **Headline** (800, clamp(30px,2.7vw,40px), 1, mayúsculas): título de página con filete debajo; saludo del resumen hasta 48px.
- **Title** (700, 21px, 1.05, mayúsculas, 0.02em): cabeceras de panel y modal; cabecera del ticket 26px.
- **Figure** (800, 28px, tabular): precio en oro de la tarjeta, cifras de KPI (28–42px).
- **Total** (800, clamp(38px,3.2vw,48px), tabular, crema sobre rojo de caja): solo en la placa del total.
- **Body** (Barlow 500, 14px, 1.45): texto operativo; nombre de producto en 700 17px.
- **Label** (Barlow Condensed 700, 12px, 0.12–0.2em, mayúsculas): encabezados de tabla, nombres de métrica, grupos del riel (11px), hora.
- **Plaque** (Grenze Gotisch 700, 27–34px): nombre de la tienda en el riel, nombre del empleado de la semana, marca de la pantalla de carga.
- **Script** (Yellowtail 400, 1.15–1.22em, girada −4°, oro): una palabra de firma dentro del titular display; subtítulo de la tienda en el riel.

### Named Rules
**The Cifra Tabular Rule.** Toda cifra (td, strong, time, métricas) usa números tabulares; los importes se leen en columna.

**The Rótulo Escaso Rule.** Grenze Gotisch solo en placas de nombre; Yellowtail solo como una palabra de firma por titular. Ninguna de las dos en botones, campos ni tablas.

**The Piso de Legibilidad Rule.** Nada funcional por debajo de 11–12px.

## Layout

App de riel lateral más área principal. En escritorio (≥1101px) el riel **arranca colapsado por defecto** (sidebar.js, comportamiento aprobado de v14.7): cápsula candy con moldura de cromo, iconos, tooltips con el nombre y una placa de cromo deslizante con punto oro que marca la sección actual. El botón superior del riel lo expande para ver todos los nombres; ≤1100px el riel es cajón con fondo atenuado y control de foco.

Barra superior transparente que se vuelve sólida al desplazar: sección actual, búsqueda global (Ctrl K), hora en oro y usuario. Caja: rejilla de tarjetas a la izquierda y ticket a la derecha; en móvil el ticket se resume en la barra "Ver pedido". Resumen: saludo y hora, banner ilustrado (texto en el 52 % izquierdo), franja de métricas sin caja separada por filetes de 1px, ranking (cuatro filas visibles, luego desplaza con desvanecido) y empleado de la semana.

Ritmo: 4 / 8 / 12 / 16 / 22 / 34px. Cabecera de página con 18px debajo; tarjeta de producto con 14–16px de relleno; métrica con 16×22px; banner con 34×40px. Puntos de quiebre: 1100px (métricas a 2×2, riel cajón) y 700px (banner apilado con la escena como franja inferior de 168px, titulares reducidos).

**The Métrica Sin Caja Rule.** Las cifras clave del resumen van sobre el fondo, separadas por líneas, no dentro de tarjetas.

## Elevation & Depth

Híbrido: capas tonales (ground → panel → panel-2 → panel-3, con inset hundido) más sombras suaves que caen hacia abajo. Las superficies llevan un brillo superior de 1px y una sombra larga y difusa; el relieve de carrocería (moldura de cromo, metalflake) se hace con sombras inset. No hay glows de neón.

### Shadow Vocabulary
- **Panel** (`box-shadow: 0 1px 0 rgba(255,255,255,.05) inset, 0 18px 40px -26px rgba(0,0,0,.9)`): paneles, tarjetas en reposo.
- **Emergente** (`box-shadow: 0 24px 60px -20px rgba(0,0,0,.85), 0 2px 10px rgba(0,0,0,.35)`): modales, toasts, resultados de búsqueda, tooltips, paneles del mapa.
- **Botón oro** (`inset 0 1px 0 rgba(255,255,255,.7), inset 0 -2px 0 rgba(120,60,0,.25), 0 10px 22px -12px rgba(255,181,38,.65)`): relieve de caramelo de la acción.
- **Placa de empaque** (`inset 0 0 0 1.5px rgba(255,244,236,.55), inset 0 -3px 0 rgba(0,0,0,.18), 0 18px 34px -16px rgba(0,0,0,.9)`): total y barra móvil.
- **Moldura del riel** (`inset -3px 0 0 #e7edef, inset -4px 0 0 #6d7c80, …`): canto cromado de la carrocería.
- **Sombra de rótulo** (`text-shadow: 0 2px 0 / 0 3px 0` en tinta roja u oscura): solo bajo texto display, script y cifras sobre rojo, como letra pintada.

### Named Rules
**The Sin Neón Rule.** El relieve viene de luz superior y sombra inferior; ningún texto ni borde brilla.

## Shapes

Esquinas generosas y redondeadas de carrocería: campos 11px, botones 12px, placas 16px, tarjetas y paneles 20px, ticket y banner 24px, acceso 28px; pestañas, chips e insignias en cápsula. El riel plegado es una cápsula de 26px. Divisores de 1px; líneas punteadas solo dentro del ticket (entre líneas del pedido) y en el aro del disco de las ilustraciones. El filete dorado (SVG de línea con bucle central y punto) es el ornamento recurrente; las franjas blancas diagonales del empaque son la única otra geometría de marca.

## Components

### Buttons
Caramelo oro, firmes y táctiles.
- **Shape:** curva media (12px; cobrar y acceso 14px).
- **Primary:** degradado oro con tinta de oro, borde #b87400, 42px de alto (cobrar 56px, acceso 52px, Agregar 11px de radio).
- **Hover / Focus:** brillo radial blanco que sigue al cursor, brillo +5 %; el icono avanza 4px. Foco con contorno oro de 2px a 3px. Al pulsar, escala 0.97.
- **Cobrar:** además, un barrido de brillo cada 5.5s mientras está habilitado.
- **Secondary / Ghost:** panel-2 con borde de línea; hover sube a panel-3.
- **Danger:** rojo claro al 10 % con texto #ffb3b5.
- **Disabled:** panel-2, texto tenue, sin sombra.

### Chips y pestañas
- **Style:** transparentes, borde de línea, texto crema 2, 38px, 700 13px.
- **State:** seleccionado = placa de cromo (degradado blanco → #d5dfe2) con tinta de cromo; el selector deslizante comparte la placa.

### Cards / Containers
- **Corner Style:** 20px.
- **Background:** degradado de panel cálido.
- **Shadow Strategy:** Panel en reposo; la tarjeta de producto sube 3–4px y se inclina hacia el cursor.
- **Border:** línea al 10 %; fuerte en hover.
- **Internal Padding:** 14–16px.

### Tarjeta de producto
Foto real a sangre (`cover`, encuadre 50 % 55 %) con velo inferior y zoom de 1.06 al pasar. Sin foto (Helado, Caja Feliz y Cajita Policía): ilustración contenida sobre disco candy con aro punteado dorado y metalflake; flota suavemente en la caja. Categoría, nombre en Barlow 700 17px, contenido apagado, precio oro en Figure y botón Agregar oro. Contador del carrito en rojo con borde blanco. Al agregar, la imagen da un salto y una miniatura vuela al ticket.

### Inputs / Fields
- **Style:** hundido (inset) con borde de línea, 11px, sombra interior.
- **Focus:** borde oro y halo oro al 18 % de 3px.
- **Error / Disabled:** texto de error #ffb3b5.

### Navigation
Riel candy rojo con metalflake y canto cromado. Nombre de la tienda en Grenze Gotisch, subtítulo en Yellowtail, grupos en Label. Ítems en crema; hover oscurece; activo = placa de cromo con tinta de cromo, icono rojo y punto oro. Colapsado por defecto en escritorio con placa deslizante; se expande con el botón superior.

### Placa del total (firma)
Única placa invertida de la pantalla: empaque Burger Shot en rojo de caja con franjas blancas diagonales en SVG en las esquinas inferiores, brillo superior y canto crema; etiqueta en Label crema y total en Total crema con sombra de tinta roja. Salta como hidráulico (420ms) y suelta chispas oro al subir, pero la cifra ya es la real. La **barra móvil "Ver pedido"** y la **ficha del empleado de la semana** usan el mismo lenguaje de empaque.

### Ticket
Panel de 24px con cabecera Title de 26px y contador rojo; líneas separadas por guiones; las nuevas entran desde la derecha con destello oro. Variante clara de papel de envoltura con sus propios tokens.

### Escena de noche de crucero (3D)
Escena 3D en tiempo real (kustom-3d.js, three.js r170 incluido en assets/vendor): lowrider candy Burger Shot con pintura de barniz y microdestellos, techo de vinilo, cromos, filete dorado, faros y calaveras encendidos y rines de rayos cruzados de 13"; local con fascia de neón, toldo a rayas, interior iluminado con clientes, letrero tipo pilón con el emblema aprobado, palmeras, luna y estrellas; calle mojada con reflejos. Movimiento: el coche llega rodando y frena con cabeceo, luego hace saltos hidráulicos y balanceo cada 9 s; la cámara deriva despacio y sigue al cursor; el neón parpadea de vez en cuando. Un solo lienzo se mueve entre carga, acceso y banner, a 30 fps y solo mientras está a la vista. La ilustración vectorial (kustom-scene.js) queda debajo como respaldo: se ve sin WebGL, en modo Rendimiento o con el movimiento desactivado; con movimiento reducido el 3D se dibuja en una pose quieta.

### Movimiento
Curvas `cubic-bezier(.23,1,.32,1)` (salida) y `cubic-bezier(.77,0,.175,1)` (reordenación). Estados 160–260ms; saltos 420–520ms; entradas 520–560ms en cascada de 45ms; banner y filete 900ms. El ranking se reordena con FLIP en su sitio. Todo se detiene con `prefers-reduced-motion`, con el modo Rendimiento (`body.motion-off` / `data-effects=performance`) y con la pestaña oculta; los atajos de teclado tampoco animan la placa.

**The Importe Quieto Rule.** Los importes nunca se animan, cuentan ni se retrasan: la placa se mueve, la cifra no.

## Do's and Don'ts

### Do:
- **Do** usar oro (gold) para toda acción principal y toda cifra de dinero, y cromo para todo estado seleccionado.
- **Do** reservar el empaque rojo con franjas blancas diagonales para la placa del total, la barra "Ver pedido" y el empleado de la semana.
- **Do** dar prioridad a las fotos reales de assets/menu-fotos; usar las ilustraciones de assets/kustom/food solo para Helado, Caja Feliz y Cajita Policía, y la ilustración para escenas y estados vacíos.
- **Do** poner el filete dorado bajo títulos de página y cabeceras del resumen.
- **Do** escribir cifras en Barlow Condensed 800 con números tabulares.
- **Do** detener todo movimiento con movimiento reducido, modo Rendimiento y pestaña oculta.
- **Do** mantener el riel colapsado por defecto en escritorio.

### Don't:
- **Don't** reintroducir neón, glows ni color por sección.
- **Don't** usar rojo para botones de acción ni oro como fondo de superficie.
- **Don't** animar, contar ni retrasar un importe.
- **Don't** poner Grenze Gotisch o Yellowtail en controles, tablas o texto corrido.
- **Don't** usar verde como acento decorativo; es estado.
- **Don't** meter las métricas clave del resumen en tarjetas.
- **Don't** añadir rótulos pequeños en mayúsculas sobre los títulos (kickers); la ficha del empleado de la semana lo trae como deuda, no como patrón.
