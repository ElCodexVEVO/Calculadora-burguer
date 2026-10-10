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
- Logo del pedido vacío con sombra ovalada suave debajo, separada de la imagen y sincronizada con la flotación, sin resplandor. Se retiró el texto de ayuda sobre cantidades del catálogo.
- Logo de cabecera con entrada y balanceo breve; emblema del pedido vacío con entrada y flotación suave. El texto de la marca permanece quieto. Ambos reflejos se recortan a la silueta y el movimiento se detiene fuera de pantalla o al desactivar animaciones.
- Barra lateral con una sola tarjeta de identidad y el logo real, opciones de 44 px, selección naranja tenue y división clara entre Operación y Gestión. Tarjeta de temporada simplificada, estado de conexión en una línea y perfil compacto.

## Archivos para actualizar

`index.html`, `ofrenda.css`, `ofrenda.js`, `logo.css`, `logo.js`, `app.js`, `DEMO_V6.html` y `DEMO_ACCESO.html`.

El ZIP contiene el proyecto completo. Se conserva el comportamiento de los cálculos y las integraciones.

## Revisión realizada

Revisión visual en navegador de escritorio y móvil; tamaños entre 320 y 1440 px, ventana de 600 px de alto, ambos temas del ticket, cantidades por Enter, acceso +5, convenio de Caja Feliz, cupón NOCHE15 y registro de una venta de demostración. Verificación de sintaxis JavaScript y de las referencias locales de HTML.

Revisión adicional de plantillas: guardar, actualizar sin duplicar, vaciar y volver a cargar el pedido, abrir y cancelar la confirmación de borrado. Comprobación de campos a 320 px, ambos temas y cupón NOCHE15 ($280 → $238).

Animaciones: verificación del movimiento visible, pausa del emblema fuera de pantalla y apagado/encendido mediante Animaciones suaves. La sombra del pedido vacío acompaña la flotación y permanece estática con el movimiento desactivado.

Barra lateral: revisión a 1440 × 960, 406 × 884 y 320 × 640 px. Navegación a Caja y Estadísticas, despliegue de Más herramientas y acceso al perfil. Sin desbordamiento horizontal; el menú completo cabe a 884 px de alto y se recorre en pantallas más bajas.

Captura del último ajuste: `preview/menu-renovado-movil.jpg`. Los ajustes previos se ven en `preview/plantillas-renovadas.jpg` y `preview/logos-animados.jpg`.
