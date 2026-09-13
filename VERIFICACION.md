# Verificación — BurgerShot V5

28 escenarios superados en JSDOM con un cliente Supabase simulado. Las pruebas ejercitan el app.js real y los elementos del index.html real. No validan la configuración ni los permisos efectivos de una base Supabase remota.

## Escenarios

- Inicio, seis categorías y catálogo completo de 30 productos
- Agregar, sumar, miniatura y total por producto
- Restar hasta cero y conservar foco de teclado
- Convenio del 25% y comisión del 20% sobre el total descontado
- Convenio limitado a hamburguesas
- Exclusiones Policía/Sheriff/EMS y convenios inactivos
- Caja EMS restringida y etiqueta sin descuento
- Quitar una línea y vaciar orden
- Filtros, búsqueda, paquetes y estado sin resultados
- Un error de guardado conserva la orden y permite reintentar
- Payload de venta, empleado, método de pago, nota y bloqueo de doble cobro
- Cambios de precio durante confirmación exigen revisar el nuevo total
- Detalle y borrado de órdenes por administrador
- Anulación de ventas conservada
- Creación de empleados conserva el contrato de Edge Function
- Edición de comisión y rol de empleado
- Restablecer contraseña conserva la llamada segura de empleados
- Dar de baja y reactivar usuarios conserva el perfil
- Borrar perfil elimina cuentas sin historial asociado
- Pago/corte de comisiones y protección de órdenes ya pagadas
- Exportación CSV del historial
- Crear producto con imagen elegida sin migración SQL
- Editar precio y eliminar producto
- Crear, editar y eliminar convenios
- Acceso rápido funcional con fotografía
- Todas las rutas de catálogo y miniaturas existen
- Sin errores de ejecución en el DOM
- Permisos de navegación del empleado conservados

## Integridad del proyecto

- Esquema V3, config.js y patch V4.2 conservan el contrato original. employee-admin se amplió con borrado protegido de perfiles.
- Patch V4.1: se retiró una cláusula ON duplicada, sin cambiar el permiso.
- Cálculo de precios, descuentos y comisión del POS conserva las reglas originales.
- Imágenes locales incluidas: 12 fotografías y 12 miniaturas WebP.
- index.html carga Supabase; el simulador no se incluye en la app entregada.

## Límites de la verificación

- No se proporcionaron URL ni clave pública de un proyecto Supabase configurado. No se probaron autenticación, RLS, Edge Function ni Realtime contra tu cuenta real.
- El navegador del entorno no permitió abrir los archivos de prueba; el renderizado visual no se pudo confirmar. VISTA_PREVIA.html muestra el HTML/CSS real con datos de ejemplo para revisar el diseño.

## Corrección V5.0.5

Se revisó el fallo mostrado por el usuario: fotos colapsadas y contenido recortado al ajustarse las filas a la altura del catálogo. Se fijó un alto no reducible para las fotos, se desactivó la contracción del bloque de información y se definieron filas por contenido con scroll vertical. La revisión cubre Todos y Mayoreo, que comparten el componente de tarjeta. También se añadió baja/reactivación, borrado protegido de usuarios, lectura del mensaje real de error de employee-admin, una jerarquía visual renovada para Dashboard, Estadísticas y Empleados y una escala legible para Pagos y cortes. La validación visual en navegador sigue pendiente.
