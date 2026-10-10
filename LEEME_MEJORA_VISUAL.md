# Propuesta visual de Burger Shot

Abre `DEMO_V6.html` para probar el diseño con datos de ejemplo. La sección Caja muestra los cambios; `DEMO_ACCESO.html` permite revisar el acceso.

## Cambios

- Fotos de producto en formato 16:9, tarjetas más compactas y cantidades rápidas agrupadas.
- Botones Agregar y categorías con naranja discreto; Cobrar conserva el naranja sólido.
- Ticket crema por defecto. El botón de luna/sol conserva la elección local de tema oscuro o claro.
- Textos secundarios con más contraste y un total de mayor tamaño.
- Cabecera móvil compacta, barra de pedido y confirmaciones breves.
- Decoración quieta en Caja y vuelo de miniatura reducido a 280 ms.
- Formularios y resumen separados para evitar recortar el cobro. En ventanas de escritorio de 700 px de alto o menos, el ticket se recorre completo con la página.
- Cupones y promociones con etiquetas claras; selectores con una sola flecha y colores del tema del ticket.
- Plantillas en una fila completa, con Guardar, Cargar pedido y eliminar separados. El nombre y la confirmación de borrado se muestran dentro del bloque.
- Al desplegar estas opciones en escritorio, el ticket crece y se recorre con la página.
- Logo del pedido vacío sin sombra ni resplandor; se retiró el texto de ayuda sobre cantidades del catálogo.

## Archivos para actualizar

`index.html`, `ofrenda.css`, `ofrenda.js`, `logo.css`, `app.js`, `DEMO_V6.html` y `DEMO_ACCESO.html`.

El ZIP contiene el proyecto completo. Se conserva el comportamiento de los cálculos y las integraciones.

## Revisión realizada

Revisión visual en navegador de escritorio y móvil; tamaños entre 320 y 1440 px, ventana de 600 px de alto, ambos temas del ticket, cantidades por Enter, acceso +5, convenio de Caja Feliz, cupón NOCHE15 y registro de una venta de demostración. Verificación de sintaxis JavaScript y de las referencias locales de HTML.

Revisión adicional de plantillas: guardar, actualizar sin duplicar, vaciar y volver a cargar el pedido, abrir y cancelar la confirmación de borrado. Comprobación de campos a 320 px, ambos temas y cupón NOCHE15 ($280 → $238).

Capturas del último ajuste: `preview/plantillas-renovadas.jpg` y `preview/logo-pedido-sin-sombra.jpg`.
