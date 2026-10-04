# Recursos de temporada

Diseño aprobado: BurgerShot con Halloween y Día de Muertos. Fondo carbón y ciruela, texto marfil, controles naranja cempasúchil. La decoración se concentra en la cabecera; los controles permanecen como HTML real.

Los dos recursos gráficos se generaron mediante imagegen a partir de la imagen aprobada por el usuario y se guardaron como WebP sin cambiar su composición:

- `masthead.webp` (1983 × 793): papel picado naranja, fucsia y morado; calabazas a la izquierda; calaverita, vela y cempasúchil a la derecha; centro oscuro sin texto ni controles. La cabecera utiliza capas CSS para adaptar las esquinas a cada pantalla.
- `food-atlas.webp` (1536 × 1024): cuatro fotografías en cuadrantes iguales. Hamburguesa arriba a la izquierda, combo arriba a la derecha, papitas abajo a la izquierda y Cola-Shot abajo a la derecha. Luz cálida, fondo oscuro, flores y envases decorados. Se muestra cada cuadrante mediante CSS; los nombres y precios proceden del catálogo, no de la imagen.

Los prompts especificaron fotografías comerciales, textos de interfaz ausentes, controles y datos añadidos en HTML, y conservación de la estética aprobada. Los demás productos mantienen sus imágenes existentes para no cambiar su identidad. Peso combinado de imágenes: 479 642 bytes.

La fuente local `barlow-condensed-bold.woff` se usa en la marca. Copyright 2017 The Barlow Project Authors (https://github.com/jpt/barlow). Licencia: SIL Open Font License 1.1, incluida en `OFL.txt`.

`preview-data.js` se carga exclusivamente en VISTA_PREVIA.html y en pruebas. No forma parte de la conexión operativa de index.html.
