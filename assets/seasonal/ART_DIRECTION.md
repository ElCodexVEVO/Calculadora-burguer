# Recursos de temporada

Diseño aprobado: BurgerShot con Halloween y Día de Muertos. Fondo carbón y ciruela, texto marfil, controles naranja cempasúchil. La decoración se concentra en la cabecera; los controles permanecen como HTML real.

La cabecera se generó mediante la herramienta integrada imagegen a partir de la imagen aprobada por el usuario y se guardó como WebP sin cambiar su composición:

- `masthead.webp` (1983 × 793): papel picado naranja, fucsia y morado; calabazas a la izquierda; calaverita, vela y cempasúchil a la derecha; centro oscuro sin texto ni controles. La cabecera utiliza capas CSS para adaptar las esquinas a cada pantalla.
- `food-atlas.webp` (1536 × 1024): referencia inicial de cuatro fotografías. Se conserva como referencia de estilo; la aplicación ya no recorta sus cuadrantes para mostrar productos.

En V6.0.1 se adaptaron los 12 tipos de producto mediante una edición individual con imagegen. Cada alimento mantiene su identidad e ingredientes; cambian el entorno y los envases con calaveritas, cempasúchil y motivos de Halloween. Se utiliza una foto independiente de 720 × 480 px y una miniatura de 180 × 120 px para cada tipo. Las 24 imágenes suman 959 492 bytes. Se muestran con `object-fit: contain`, sin recortar los productos. Consulta los [prompts finales y nombres de archivo](menu/PROMPTS.md).

La franja del papel picado usa una escala vertical fija para mostrar los adornos completos, en lugar de ampliarlos en función del ancho de la pantalla. La identidad y los controles se distribuyen en el flujo de la cabecera; las decoraciones permanecen en los extremos.

La fuente local `barlow-condensed-bold.woff` se usa en la marca. Copyright 2017 The Barlow Project Authors (https://github.com/jpt/barlow). Licencia: SIL Open Font License 1.1, incluida en `OFL.txt`.

`preview-data.js` se carga exclusivamente en VISTA_PREVIA.html y en pruebas. No forma parte de la conexión operativa de index.html.
