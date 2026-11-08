# Burger Shot · calculadora y punto de venta

Versión 15.2.3 · Candy Kustom.

Punto de venta para Burger Shot en FiveM, con Supabase. Conserva la composición nocturna original, su tipografía, halos cálidos y animaciones con un banner y ambiente de uso general. Incluye restaurante 3D, alternativa 2D, caja, caja auxiliar, convenios, comisiones, perfiles y reportes.

## Rediseño 15 · Candy Kustom

Burger Shot como el autoservicio donde los lowriders de Los Santos llegan en noche de crucero. Paleta medida en las fotos del menú (negro rojizo del local, rojo del empaque, ámbar del logo y crema del papel), riel lateral en pintura candy roja con moldura de cromo, filete dorado en cabeceras y el total en una placa de club cromada.

- Capa visual: kustom.css (se carga la última). Movimiento: kustom.js. Escena ilustrada: kustom-scene.js.
- Fotos del menú en assets/menu-fotos (origen en ORIGEN.json). Ilustraciones de respaldo en assets/kustom/food para productos sin foto (regenerables con node design/kustom/build-food.cjs).
- Tipografías autoalojadas en assets/fonts/kustom (licencias en LICENCIAS.md).
- Animaciones: salto de la placa del total, chispas, vuelo al ticket, tarjetas que flotan e inclinan, lowrider que llega y salta, paralaje, entradas en cascada y microinteracciones. Respetan movimiento reducido, modo Rendimiento y pestaña oculta. Los importes nunca se animan.

Consulta ACTUALIZAR_V15_CANDY_KUSTOM.md para publicar.

## Interacciones del resumen

- Métricas con acceso al detalle y selección diaria de la gráfica con teclado.
- Gráfica de líneas o barras basada en los datos del periodo.
- Se retiraron filigranas, accesos sueltos, acceso rápido y últimas ventas.
- Glows, transiciones y movimiento que respetan la preferencia de movimiento reducido.

## Rol de gerente

El administrador puede elegir Gerente al crear o editar una cuenta desde Equipo. El gerente puede crear empleados normales, modificar su nombre, usuario, comisión y estado, consultar las ventas generales filtradas por empleado y gestionar descuentos/convenios. Las cuentas administrativas, la asignación de roles privilegiados y la eliminación de cuentas se mantienen bajo control del administrador.

Descuentos es un permiso independiente del catálogo de productos. Los permisos de catálogo existentes conservan su acceso previo a convenios.

Para otra instalación, aplica supabase_patch_v14_manager.sql después de V6 y despliega la función employee-admin incluida. La instalación de este proyecto se actualizó con esa migración y la función en la misma entrega.

## Vista previa y pruebas

Ejecuta node preview-server.cjs y abre http://127.0.0.1:4173/DEMO_V6.html. La demo utiliza datos simulados. DEMO_ACCESO.html muestra el acceso; index.html utiliza la conexión existente de config.js.

Desde tests/, ejecuta npm ci y npm test. La suite incluye pruebas del resumen, permisos SQL de gerente, servicio de cuentas y sus flujos de interfaz. No se realizan ventas reales durante estas pruebas.

Consulta ACTUALIZAR_GENERAL.md para actualizar una instalación. La documentación histórica describe versiones anteriores.

## Acabado y movimiento

Se conservan los bordes rojos luminosos, el acento ámbar y las entradas del diseño original. El modo Rendimiento y movimiento reducido detienen los efectos. Consulta docs/ASSETS_GENERAL.md para el origen y los prompts del arte de uso general.

La navegación abre compacta, muestra etiquetas con cursor o teclado y permite expandir los nombres. Más herramientas abre un panel lateral que se recorre con flechas y se cierra con Escape.

El fondo del panel usa grafito frío, textura sutil y tres capas de luz roja y ámbar animadas. Se detienen en modo Rendimiento, movimiento reducido y con la pestaña oculta.
