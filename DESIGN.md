---
name: Burger Shot V7 · Ofrenda nocturna
description: Punto de venta de temporada sobre carbón cálido, con naranja cempasúchil para actuar y festón de papel picado como firma.
colors:
  ground: "#141012"
  shell-solid: "#191316"
  surface: "#1f181b"
  surface-2: "#272023"
  surface-3: "#31282c"
  inset: "#161113"
  line: "rgba(246,235,217,.10)"
  line-2: "rgba(246,235,217,.17)"
  line-3: "rgba(246,235,217,.28)"
  cream: "#f6ebd9"
  cream-2: "#ddd0bf"
  muted: "#b8a999"
  faint: "#9d8f83"
  mari: "#f28c1b"
  mari-hi: "#ffa53d"
  mari-deep: "#c96a0a"
  mari-ink: "#1c0f05"
  mari-soft: "rgba(242,140,27,.14)"
  mari-line: "rgba(242,140,27,.42)"
  gold: "#ffc163"
  wine: "#7a1e3a"
  plum: "#5b2a5e"
  plum-hi: "#a76aac"
  plum-soft: "rgba(167,106,172,.16)"
  teal: "#52cfaa"
  teal-soft: "rgba(82,207,170,.13)"
  red: "#ff7a6b"
  red-soft: "rgba(255,122,107,.13)"
  ticket-paper: "#f6ecdc"
  ticket-ink: "#2b1d1f"
typography:
  display:
    fontFamily: "Archivo, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(44px, 4.6vw, 72px)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 112"
  headline:
    fontFamily: "Archivo, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.012em"
    fontVariation: "'wdth' 112"
  title:
    fontFamily: "Archivo, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "17px"
    fontWeight: 750
    lineHeight: 1.25
    fontVariation: "'wdth' 106"
  body:
    fontFamily: "Archivo, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
    fontVariation: "'wdth' 100"
  label:
    fontFamily: "Archivo, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.45
  total:
    fontFamily: "Archivo, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "34px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 108"
  wordmark:
    fontFamily: "Archivo, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "20px"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 125"
rounded:
  xs: "6px"
  sm: "9px"
  md: "13px"
  lg: "17px"
  pill: "999px"
spacing:
  control-gap: "8px"
  tight: "10px"
  grid-gap: "14px"
  panel-gap: "16px"
  panel-pad: "20px"
  page-pad: "28px"
  page-pad-mobile: "14px"
components:
  button-primary:
    backgroundColor: "{colors.mari}"
    textColor: "{colors.mari-ink}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    height: "42px"
  button-primary-hover:
    backgroundColor: "{colors.mari-hi}"
  button-primary-disabled:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.faint}"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.cream}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    height: "42px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-3}"
  button-danger:
    backgroundColor: "#3a1a1c"
    textColor: "#ffd9d3"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  button-row:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.cream}"
    rounded: "{rounded.xs}"
    padding: "6px 12px"
    height: "34px"
  button-icon:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.cream-2}"
    rounded: "{rounded.sm}"
    size: "40px"
  checkout:
    backgroundColor: "{colors.mari}"
    textColor: "{colors.mari-ink}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "54px"
  input:
    backgroundColor: "{colors.inset}"
    textColor: "{colors.cream}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
    height: "42px"
  category-tab:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.cream-2}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
    height: "40px"
  category-tab-active:
    backgroundColor: "{colors.mari}"
    textColor: "{colors.mari-ink}"
  product-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.cream}"
    rounded: "{rounded.lg}"
    padding: "12px 14px 14px"
  order-panel:
    backgroundColor: "#221a1d"
    textColor: "{colors.cream}"
    rounded: "{rounded.lg}"
    width: "372px"
  order-dock:
    backgroundColor: "{colors.mari}"
    textColor: "{colors.mari-ink}"
    rounded: "16px"
    height: "58px"
  modal:
    backgroundColor: "#241c1f"
    textColor: "{colors.cream}"
    rounded: "{rounded.lg}"
    padding: "22px 24px"
    width: "640px"
  toast:
    backgroundColor: "#2a2125"
    textColor: "{colors.cream}"
    rounded: "{rounded.md}"
    padding: "12px 14px 13px 12px"
  table-header:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.muted}"
    padding: "11px 14px"
---

# Design System: Burger Shot V7 · Ofrenda nocturna

## Overview

**Creative North Star: "La mesa de la ofrenda nocturna"**

La caja se usa de noche, en una ventana junto al juego o en el móvil con el pulgar, alternando la vista entre el chat de FiveM y el total. Por eso el tema es oscuro: carbón cálido con un punto de vino, texto crema y un solo color que pide acción. La mesa de trabajo (catálogo, ticket, tablas, ventanas) queda limpia; la temporada vive en el marco: papel picado colgando de la cabecera, una vela en el margen del menú lateral, festones recortados en los bordes.

El sistema vive en `ofrenda.css` (tokens `--o-*` en `:root`), que sustituyó a ocho capas anteriores; `logo.css` y `logo.js` llevan la marca y `auth-scene.css` la escena del acceso. Es denso y directo: indicadores en franja dividida en lugar de tarjetas sueltas, listas con divisor en lugar de tarjetas anidadas, y cifras siempre tabulares.

**Key Characteristics:**
- Fondo plano carbón (`ground`) con tres escalones de superficie y bordes crema translúcidos.
- Naranja cempasúchil para acción, selección y total; turquesa solo para éxito.
- Una sola familia, Archivo variable; la jerarquía se hace con peso y anchura, no con otra tipografía.
- Festón de papel picado con máscara como borde de ticket, ventana, franja de inicio y tarjeta de acceso.
- Movimiento corto con una única curva de salida; todo se apaga con movimiento reducido o «Animaciones suaves» desactivado.
- La decoración de temporada no intercepta clics y va separada de la marca.

## Colors

Carbón cálido, crema y cempasúchil; ciruela y vino solo como detalle.

### Primary
- **Naranja cempasúchil** (`mari`, con `mari-hi` para hover y borde, `mari-deep` en degradados de barras): botón principal, Añadir, Cobrar, barra de pedido móvil, pestaña de categoría activa, elemento de navegación activo, foco de campos (borde `mari` más anillo `0 0 0 3px rgba(242,140,27,.22)`), festones. Texto encima siempre `mari-ink`.
- **Oro de vela** (`gold`): importes que mandan (precio de producto, total, total del resumen de cobro), contadores sobre fondo oscuro, enlaces y acciones de texto, anillo de foco global (`2px`, desplazado `2px`).
- `mari-soft` y `mari-line`: fondo y borde de lo seleccionado o resaltado (navegación activa, avisos informativos, producto ya en el pedido).

### Secondary
- **Turquesa de papel picado** (`teal`, `teal-soft`): éxito y estado en línea. Etiqueta verde, punto de sesión y sincronización, aviso de éxito, píldora «añadido» sobre la foto, pulso `is-success`.

### Tertiary
- **Ciruela** (`plum-hi`, `plum-soft`): segunda serie y posiciones no líderes (número de ranking, barra de progreso del equipo).
- **Vino** (`wine`): avatares e icono del negocio. Plano, sin degradado.
- **Coral** (`red`, `red-soft`): error, campo inválido, quitar línea, aviso de error. El botón de peligro usa fondo `#3a1a1c` con borde `#6e2f31`.

### Neutral
- **Carbón** (`ground`): fondo de página, plano. Menú lateral en `#1b1417` a `#171114`.
- **Superficies** (`surface`, `surface-2`, `surface-3`): panel, control en reposo, control en hover o elevado. `inset` para campos y huecos.
- **Líneas** (`line`, `line-2`, `line-3`): divisor interno, borde de control, borde en hover.
- **Crema** (`cream`, `cream-2`, `muted`, `faint`): título y cifra, texto de cuerpo, texto secundario, texto terciario y marcadores.
- **Ticket claro** (`ticket-paper`, `ticket-ink`): variante opcional del ticket en papel crema; redefine los tokens dentro del panel (oro pasa a `#9d4e05`, turquesa a `#13775d`, coral a `#b3261e`).

### Named Rules
**La regla del turquesa.** Turquesa significa «salió bien» o «en línea» y nada más. Los importes, comisiones y descuentos van en crema; el total, en oro.

**La regla del naranja.** Naranja relleno significa «pulsa aquí» o «esto está seleccionado». Una sola acción naranja rellena por zona de trabajo: Añadir en la tarjeta, Cobrar en el ticket.

## Typography

**Display Font:** Archivo variable (ejes `wdth` 62–125 y `wght` 400–900; respaldo system-ui, Segoe UI, Roboto)
**Body Font:** la misma familia a anchura 100

**Character:** rótulo popular hecho con una sola familia: negras anchas para marca y títulos, anchura normal para trabajar. El lettering ilustrado existe únicamente dentro del emblema del logo.

### Hierarchy
- **Display** (800, `clamp(44px, 4.6vw, 72px)`, 1.02, anchura 112): solo el titular del acceso.
- **Headline** (800, 28px, 1.12, anchura 112; 24px en móvil): título de página. Título de ticket y de ventana: 800, 22px, anchura 108–110.
- **Title** (750, 17px, 1.25, anchura 106): cabecera de panel. Nombre de producto: 750, 16px, anchura 104.
- **Body** (400, 14px, 1.45; 15px en móvil): texto general y celdas. Campos a 16px en móvil para evitar el zoom.
- **Label** (600, 13px): etiquetas de campo, notas y cabeceras de tabla (700, 12px, tracking .02em, sin mayúsculas). Mínimo 12px.
- **Total** (900, 34px, 1, anchura 108, tabular): total del ticket. Importes menores: precio 800/23px, indicador 800/26px, Cobrar 900/20px.
- **Wordmark** (900, anchura 125, mayúsculas, 19–20px; `clamp(28px, 2.6vw, 38px)` en el acceso): BURGER SHOT, con SHOT en naranja y sombra suave `0 1px 0 rgba(0,0,0,.35), 0 2px 12px rgba(0,0,0,.35)`.

### Named Rules
**La regla tabular.** Toda cifra que pueda cambiar o alinearse (importes, cantidades, contadores, celdas de tabla, reloj) lleva `font-variant-numeric: tabular-nums`.

**La regla de la anchura.** La jerarquía sube ensanchando: 100 cuerpo, 104–108 cifras y títulos menores, 110–112 títulos, 125 solo la marca. Las mayúsculas quedan para la marca y la etiqueta de grupo del menú lateral (12px, tracking .06em).

## Layout

- **Cáscara:** menú lateral fijo de 232px y cabecera pegajosa de 64px (58px en móvil) translúcida (`rgba(22,17,19,.86)` con desenfoque de 14px). Página con relleno `50px 28px 40px` (el aire superior deja sitio al papel picado) y ancho máximo de 1720px.
- **Caja:** rejilla `minmax(0,1fr) 372px` con separación de 20px (344px por debajo de 1380px). Catálogo `repeat(auto-fill, minmax(212px, 1fr))` con 14px; modo compacto a 176px y foto 2:1. Ticket pegajoso bajo la cabecera, con altura ajustada por script para que Cobrar nunca quede oculto.
- **Ritmo:** sin tokens de espaciado; los pasos que se repiten son 8px entre controles, 10–14px entre tarjetas, 16px entre paneles, 18–20px de relleno de panel y 28px de página.
- **Cortes:** 1380, 1240, 1100, 900, 760 y 380px. A 1100px el menú lateral pasa a cajón de 264px con velo, el ticket baja a flujo normal y aparece la barra de pedido. A 760px el catálogo queda a dos columnas, las categorías se desplazan en horizontal, las ventanas se anclan abajo y se ocultan búsqueda global y pétalos.
- **Táctil:** en móvil los controles de cantidad miden 40px, campos y Añadir 46px, Cobrar y barra de pedido 58px.

## Elevation & Depth

Híbrido: la profundidad base es tonal (tres superficies y bordes translúcidos); las sombras son negras, muy difusas y con desplazamiento negativo de expansión, más un filo de luz interior de 1px.

### Shadow Vocabulary
- **Reposo** (`0 1px 0 rgba(255,240,220,.035) inset, 0 10px 24px -14px rgba(0,0,0,.7)`): paneles, tarjetas, franja de indicadores.
- **Elevado** (`0 1px 0 rgba(255,240,220,.05) inset, 0 24px 48px -20px rgba(0,0,0,.78)`): ticket, tarjeta de producto en hover, caja auxiliar.
- **Flotante** (`0 18px 50px -12px rgba(0,0,0,.72), 0 2px 8px rgba(0,0,0,.35)`): ventanas, avisos, panel de notificaciones, cajón lateral.
- **Acción** (`0 1px 0 rgba(255,236,200,.35) inset, 0 8px 18px -10px rgba(242,140,27,.55)`): botón principal; Cobrar usa `0 12px 24px -12px rgba(242,140,27,.6)`.

### Named Rules
**La regla de la sombra blanda.** Ninguna sombra dura con desplazamiento, ni en cajas ni en el rótulo. La luz naranja aparece solo bajo acciones naranjas y en pulsos de respuesta que se desvanecen.

## Shapes

Esquinas suaves en cuatro pasos: 6px (botones de fila), 9px (botones, campos, iconos), 13px (avisos, subpaneles, Cobrar), 17px (paneles, tarjetas, ticket, ventanas); píldora para categorías, etiquetas y contadores. Bordes de 1px siempre; las líneas discontinuas marcan cortes de recibo (cabecera y líneas del ticket, resumen de cobro, zonas vacías).

**Firma: el festón de papel picado.** Una máscara SVG (`--papel-edge`, tesela de 22×7 con ondas perforadas) recorta una franja de color plano, repetida en horizontal:
- Ticket: franja superior `mari`, 22×7px, volteada; entre pedido y cobro en `line-3`, 18×6px; sobre el total en `mari-line`, 16×5px.
- Ventana: franja superior `mari` al 85%, 20×6px, con 18px de margen lateral.
- Franja de inicio: borde inferior `mari`, 22×7px. Tarjeta de acceso: superior `mari`, 22×7px.
- Recibo de venta: borde inferior en papel crema, 16×7px.

El festón sustituye a un borde; nunca se suma a otro borde en el mismo lado ni se anima.

## Components

Controles compactos y firmes: responden subiendo 1px en hover y encogiendo a `scale(.97)` en 80ms al pulsar. Los iconos son SVG en línea de trazo (18px, grosor 1.9, extremos redondeados, `currentColor`).

### Buttons
- **Shape:** 9px de radio, 42px de alto mínimo, relleno `10px 16px`, texto 700/14px.
- **Primary:** fondo `mari`, borde `mari-hi`, texto `mari-ink`, sombra de acción; hover a `mari-hi`.
- **Secondary:** `surface-2` con borde `line-2`; hover `surface-3` y `line-3`. **Danger:** `#3a1a1c` con texto `#ffd9d3`.
- **Fila** (34px, radio 6px, 600/13px) para acciones dentro de tablas; **icono** (40px, 36px en el ticket); **acción de texto** en oro, subrayada en hover.
- **Disabled:** el principal deshabilitado pasa a `surface-3` con texto `faint` a opacidad plena, y va acompañado de una nota que explica qué falta. El resto baja a opacidad .45.
- **Cobrar:** 54px (58px en móvil), radio 13px, etiqueta 800/15px a la izquierda e importe 900/20px tabular a la derecha.

### Inputs / Fields
- **Style:** fondo `inset`, borde `line-2`, radio 9px, 42px, texto 14px; marcador en `faint`. Selector con flecha SVG propia.
- **Focus:** borde `mari` y anillo `0 0 0 3px rgba(242,140,27,.22)`; hover a `line-3`.
- **Error:** borde `red` y mensaje 500/13px en `red`. Etiquetas 600/13px en `cream-2` encima del campo.
- **Búsqueda:** contenedor de 42px con icono; el anillo de foco va en el contenedor.

### Chips
- **Categorías:** píldoras de 40px, `surface` con borde `line-2`; activa en naranja relleno.
- **Etiquetas de estado:** píldora de 24px, 600/12px, con punto de 6px: turquesa (activo), coral (anulado o error), oro (destacado), neutra sin punto.
- **Pestañas de sección:** grupo de 4px de relleno; la activa en `surface-3` con filo inferior `mari` de 2px.

### Cards / Containers
- **Panel:** `surface`, borde `line`, radio 17px, sombra de reposo; cabecera con relleno `18px 20px` y divisor.
- **Indicadores:** una franja única dividida por líneas verticales, cifra 800/26px en crema; nunca tarjetas sueltas.
- **Listas en panel:** filas con divisor inferior, sin caja propia ni tarjetas anidadas.

### Tarjeta de producto
Foto 3:2 a sangre arriba (recorte `cover`, velo inferior, zoom a 1.04 en hover), nombre 750/16px, precio en oro 800/23px, y bajo una línea discontinua: cantidad (64px de ancho, 44px de alto) junto a Añadir naranja, y cuatro atajos +5/+10/+25/+50 de 34px. La vista previa del importe aparece como píldora oscura sobre la foto al escribir, sin mover la maquetación; la confirmación «añadido» es una píldora turquesa en la esquina de la foto. En el pedido, borde `mari-line` y contador en oro arriba a la derecha.

### Ticket
Panel de 372px con degradado `#221a1d` a `#1c1518`, borde `line-2` y sombra elevada, coronado por el festón naranja. Cabecera con título 800/22px y contador en oro; líneas separadas por guiones como en un recibo, cada una con foto de 52px, nombre, total y control de cantidad (botones de 32px, el de sumar en naranja). Zona de cobro separada por festón; subtotales en 13–14px, total en oro 900/34px bajo su propio festón, y Cobrar al pie. Admite variante clara de papel crema.

### Barra de pedido móvil
Por debajo de 1100px: botón fijo a 12px de los bordes y de la zona segura inferior, 58px, radio 16px, naranja. Contador de piezas en caja oscura con cifra oro, «Ver pedido» y total 900/21px. Entra desde abajo en 380ms, sale en 320ms y da un bote de 4px (300ms) al recibir producto. Los avisos se recolocan por encima.

### Ventanas
Velo `rgba(12,8,10,.66)` con desenfoque de 3px; ventana de 640px (460 estrecha, 1040 ancha), relleno `22px 24px`, radio 17px, sombra flotante y festón superior. Acciones alineadas a la derecha sobre un divisor; la acción destructiva se separa a la izquierda. En móvil se ancla abajo y los botones ocupan el ancho. Entra en 280ms; sale en 150ms con la curva de entrada.

### Avisos
Abajo a la derecha (ancho completo en móvil). Fondo `#2a2125`, radio 13px, sombra flotante, icono SVG en círculo de 20px (oro información, turquesa éxito, coral error) y barra de tiempo de 2px que se consume en 3,2s. Los avisos en línea usan `mari-soft` con borde `mari-line`; los de error, `red-soft`.

### Tablas
Cabecera pegajosa sobre `surface-2`, 700/12px en `muted`, tracking .02em, sin mayúsculas. Celdas con relleno `11px 14px`, divisor `line`, cifras tabulares y detalle en segunda línea a 12px. Hover de fila `rgba(246,235,217,.035)`. Estado vacío centrado en una sola celda.

### Navigation
Elementos de 42px con icono de 30px; hover en `surface`. Activo: fondo `mari-soft`, borde naranja translúcido, icono en cuadro naranja relleno y marca vertical de 3px a la izquierda. Etiquetas de grupo en mayúsculas pequeñas `faint`.

### Sistema de logo
`<burgershot-logo>` envuelve el emblema ilustrado original, que no se redibuja; solo se sirven copias redimensionadas (96, 160 y 320px). Si el script no carga, el `<img>` interior se ve igual, quieto. Si la imagen falla, prueba los originales y acaba en un monograma «BS»; nunca queda un hueco.

- **Variantes:** `full` (emblema de 128px, rótulo y subtítulo: acceso y configuración), `compact` (46px en línea: cabecera y menú lateral), `mobile` (38px, sin subtítulo ni interacción), `icon` (76px, solo emblema: pedido vacío), `loader` (150px, pantalla de carga).
- **Capas:** `glow` (luz de temporada, detrás), `shadow` (sombra de contacto elíptica), emblema, `fill` (solo cargador) y `sheen` (reflejo recortado a la silueta con el propio logo como máscara).
- **Atributos:** `animated` (entrada al hacerse visible), `interactive` (reflejo de 620ms al pasar el ratón, elevación de 1px y escala 1.015; pulsación a .98 en 90ms), `parallax` (inclinación máxima de 2,5° cerca del cursor, solo escritorio con puntero fino), `intro-key` (la entrada completa se ve una vez por sesión y clave), `decorative` (sin texto alternativo).
- **Cuándo se anima:** la entrada completa (≈1,15s: silueta, color, letras una a una cada 34ms, reflejo, sombra) solo en `full` y la primera vez; después, entrada breve de 320ms. `compact` y `mobile` entran en 360ms con 4px de desplazamiento. En reposo el logo está quieto. El único bucle es el cargador: la silueta tenue se rellena de abajo arriba cada 900ms mientras dura la carga, y se pausa si está oculto.
- **Sin movimiento:** fundido de 200ms, sin inclinación ni reflejo; el cargador muestra el emblema completo y la carga se explica con texto.
- **API:** `window.BurgerShotLogo` (`create`, `Animated`, `Compact`, `Icon`, `Loader`, `Mobile`, `seasons`) y `window.BurgerShotLoader`.

### Movimiento
- **Curvas:** salida `cubic-bezier(.22,1,.36,1)` para casi todo; entrada `cubic-bezier(.55,0,1,.45)` solo para cierres; `cubic-bezier(.45,0,.25,1)` para el vuelo al pedido y el reflejo del logo.
- **Duraciones:** 80ms pulsación, 160ms estados (hover, foco, color), 220ms cambios de panel y sombra, 480ms entradas lentas y cambio de tema del ticket.
- **Respuesta a acciones:** producto añadido, anillo naranja de 520ms; contador, bote de 320ms; cifra que cambia, 260ms; línea nueva del ticket, 280ms con escalón de 40ms; vuelo de la foto al pedido, 620ms; error, sacudida de 380ms; éxito, anillo turquesa de 700ms; recibo de venta, 2,6s con sello a los 260ms.
- **Entradas:** página 240ms, título 380ms, tarjetas de producto 360ms con escalón de 32ms, barras de gráfica 560ms con escalón de 40ms, cabecera 360ms. Acceso por etapas: logo, titular a los 120ms, formulario a los 220ms.
- **El total nunca espera:** todo efecto acompaña al importe real ya pintado.
- **Apagado:** con `prefers-reduced-motion: reduce` o con «Animaciones suaves» desactivado en Ajustes (clase `motion-off` en `body`), toda animación queda en `none` y toda transición en 0s; los pétalos se ocultan y los scripts omiten vuelo, recibo y estallido. Las animaciones ocultas se pausan.

### Decoración estacional
- **Separada de la marca:** la temporada se declara en `<html data-season="dia-de-muertos halloween">`. Sin el atributo queda la marca base. Añadir una temporada es una entrada en el registro de `logo.js` y un bloque en `logo.css`. La temporada solo toca la luz detrás del emblema (resplandor cálido; en Halloween, un filo morado muy leve), nunca el emblema.
- **No intercepta clics:** toda capa decorativa lleva `pointer-events: none` y `aria-hidden`.
- **Papel picado de cabecera:** cuelga del borde inferior de la cabecera con un cordel curvo; banderas de 40×32px (30×24px en móvil) con motivos de flor, calavera y calabaza en naranja, vino, ciruela y crema. Se mecen ±2,2° en ciclos de 4,4 a 6,6s y se recogen en 320ms al desplazar más de 12px.
- **Insignia de temporada del menú lateral** (diseño indicado por el usuario): a la izquierda, una escena 3D pequeña de vela, cempasúchil y calabaza (68×57px; 82px en el menú móvil); rótulo «BURGER SHOT» en 11px con tracking .14em y oro `#e0a03a`; título en dos líneas, «Día de Muertos» en crema e «y Halloween» en naranja (800/15px); «Edición de temporada» en 12px; fondo `#1c1416`, borde `rgba(168,104,48,.6)`, radio 14px y esquina superior derecha de papel picado (`assets/season/papel-esquina.svg`). Los textos son HTML; la decoración son recursos aparte. Es la única excepción aceptada a la regla de antetítulos.
  - **Escena:** modelo procedural de Blender (`design/temporada/escena_3d.py` → `assets/season/escena-temporada.glb`, ≈9.300 triángulos, 194 KB, sin texturas) dibujado con Three.js r170 (`season-scene.js`, módulo ES con `importmap`, sin bundler). Luz hemisférica cálida, principal crema, contraluz morado tenue y una luz puntual naranja en la llama.
  - **Movimiento:** la llama y su núcleo oscilan con tres senos superpuestos (no se percibe el ciclo) y la luz puntual varía como mucho un 24 %; el resplandor CSS respira cada 3,4s. El cursor inclina la escena como máximo 10° en horizontal y 4° en vertical, con amortiguación. Al pasar el cursor la luz sube un 35 % y el borde se aclara; el texto no se mueve. Entrada de 420ms junto al resto del menú.
  - **Coste:** Three.js y el modelo se piden solo cuando la insignia entra en pantalla (`import()` desde `ofrenda.js`); 30 fps; el bucle se detiene si no es visible, si la pestaña está oculta o con las animaciones apagadas. No se carga con `prefers-reduced-motion`, ahorro de datos o equipos de 2 GB o menos.
  - **Respaldo:** `assets/season/escena-temporada.webp` (396×330, 22 KB, render de la misma escena) ocupa el hueco desde el primer momento y se queda si falla el modelo, Three.js o WebGL. Se oculta la insignia en pantallas de escritorio bajas (<760px de alto).
- **Pétalos:** cinco, detrás de los paneles, solo en el inicio y en pantallas anchas; se desactivan en Ajustes. Nunca en la caja ni en la caja auxiliar.
- **Acceso:** foto del altar bajo un velo que garantiza contraste AA, banderines, llamas y pétalos; es la única pantalla donde la escena ocupa el fondo.

## Do's and Don'ts

### Do:
- **Do** reservar el naranja relleno para la acción principal y lo seleccionado, con texto `mari-ink`; el total y los precios van en oro.
- **Do** usar turquesa solo para éxito y estado en línea.
- **Do** poner `tabular-nums` en toda cifra y mantener el texto en 12px o más.
- **Do** separar con divisores y festones; una lista dentro de un panel son filas, no tarjetas.
- **Do** usar iconos SVG en línea de trazo, con `currentColor`.
- **Do** dar `pointer-events: none` y `aria-hidden` a cualquier decoración, y condicionar todo movimiento a `body:not(.motion-off)` y a `prefers-reduced-motion`.
- **Do** mantener la decoración en el marco: cabecera, márgenes, separadores y acceso.

### Don't:
- **Don't** poner antetítulos: ninguna etiqueta pequeña encima de un título. El título va primero; si hace falta una insignia, va debajo del nombre.
- **Don't** usar glifos o emoji como iconos (flechas, aspas, marcas de verificación tipográficas); siempre SVG.
- **Don't** poner animaciones infinitas decorativas en zonas de trabajo (catálogo, ticket, tablas, ventanas, caja auxiliar). Los bucles existen solo en el marco (banderas, vela), en el acceso y en indicadores de carga.
- **Don't** redibujar, recolorear ni recortar el emblema del logo, ni mezclar adornos de temporada dentro de él.
- **Don't** usar sombras duras con desplazamiento, degradados morados de fondo ni tarjetas dentro de tarjetas.
- **Don't** dejar que un efecto retrase u oculte el total.
