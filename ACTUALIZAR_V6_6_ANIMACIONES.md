# BurgerShot 6.6 · Animaciones y acabado visual

Esta versión incluye la caja con cantidades rápidas de V6.5.2 y añade:

- **Tarjetas con profundidad:** se elevan e inclinan suavemente al mover el ratón. Una luz dorada sigue al cursor sobre la foto.
- **Ondas al pulsar botones:** aparecen donde haces clic; con el teclado parten del centro del botón.
- **Categorías con una guía luminosa:** una línea dorada se desplaza hasta la categoría elegida, también cuando las categorías ocupan varias filas.
- **Ventanas más suaves:** el fondo aparece gradualmente y la ventana entra con un movimiento corto.
- **Avisos animados:** entran suavemente y tienen una barra que muestra el tiempo restante antes de desaparecer.
- **Navegación y títulos:** las páginas entran con una transición breve y una línea de color se dibuja bajo el título.
- **Desplegables:** el contenido de cupones y pedidos guardados aparece suavemente.
- **Pedido y total:** al agregar productos, el borde del pedido y el total reciben un destello cálido; la confirmación de unidades también tiene una entrada animada.

La inclinación de tarjetas se utiliza con ratón, para mantener estables los controles en pantallas táctiles. Todos los efectos nuevos respetan «Animaciones suaves» en Ajustes y la preferencia del sistema de movimiento reducido. Las ondas y la inclinación en curso se cancelan al desactivar las animaciones.

## Ver la actualización

Abre `DEMO_V6.html` o `VISTA_PREVIA.html`. Si la vista previa ya estaba abierta, recarga la página. La demo utiliza datos simulados.

## Actualizar una página existente

Si ya instalaste V6.5.2, reemplaza `index.html` y añade `polish-motion.css` y `polish-motion.js` en la misma carpeta. Para actualizar también la demo, reemplaza `DEMO_V6.html`.

El ZIP completo también incluye la mejora de cantidades. Para pasar desde una versión anterior, sigue además `ACTUALIZAR_V6_5_2_CAJA.md`.

Los archivos nuevos añaden decoración y respuesta visual; la lógica de caja y los parches SQL mantienen su versión anterior.

## Revisión visual

Se volvieron a comprobar los 11 escenarios de caja en un navegador aislado con archivos locales y datos simulados. También se revisaron la luz sobre las fotos, la guía de categorías, las ondas y su limpieza, la entrada de ventanas y la cancelación de efectos al desactivar animaciones. La vista móvil se revisó sin desbordamiento.

Las capturas están en `preview/tarjeta-luz-dorada.png`, `preview/ventana-animada.png` y `preview/animaciones-movil.png`. El registro de esta revisión está en `preview/revision-animaciones.json`.

## Tecnologías

La página utiliza **HTML** para su estructura, **CSS** para estilos y animaciones, y **JavaScript** para interacción, cálculos y caja. La persistencia usa **Supabase/PostgreSQL**, con migraciones SQL y funciones de servidor en **TypeScript**.
