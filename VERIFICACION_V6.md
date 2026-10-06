# Revisión visual V6.4 · Logo spooky

Se verificó el emblema transparente en la cabecera, la configuración inicial, la caja auxiliar y la orden vacía. Se inspeccionaron capturas de escritorio y móvil. Se comprobaron anchos de 320, 360, 390, 768, 900, 1120, 1440 y 1600 px: el nombre no se solapa con los botones y no hay desbordamiento horizontal.

La demo conservó un pedido con Combo Hamburguesa y Cola-Shot por $380. No hubo errores de JavaScript. El PNG utiliza RGBA y tiene las cuatro esquinas transparentes. El menú conserva sus 20 PNG originales. Resultados en `tests/visual-v6-4-results.json`; capturas en `preview/`.

Esta revisión modifica el logo, sus referencias, el icono de la pestaña y los estilos del nombre. El backend conserva las pruebas de V6 y V6.3 indicadas a continuación; no se ejecutaron operaciones en una cuenta real.

---

# Revisión visual V6.3

Se verificó la composición con Chromium en escritorio (1600 × 1160), móvil (390 × 844) y anchos de 320, 360, 768, 900, 1120 y 1440 px. No hubo desbordamiento horizontal ni errores de JavaScript. Se comprobó que el perfil permanezca dentro de la pantalla con la navegación abierta y que la opción Animaciones suaves detenga el papel picado y la iluminación.

Se comprobó el menú, cantidades desde tarjetas, guardado y carga de un pedido, cupón NOCHE15, ajuste de cantidad en móvil y registro de una venta en la demo. También se revisaron la administración e Inicio, incluyendo la presencia del cliente de la semana. Resultados en `tests/visual-v6-3-results.json`; capturas actuales en `preview/`.

Esta revisión conserva el backend V6. Las pruebas utilizan Supabase simulado; no se ejecutaron operaciones ni despliegues en una cuenta real.

---

# Revisión visual V6.2

Se verificó la nueva composición con Chromium en escritorio (1600 × 1160) y móvil (390 × 844). No hubo desbordamiento horizontal ni errores de JavaScript. Se comprobó la preferencia de movimiento reducido.

En la demo se agregaron cantidades desde una tarjeta, se guardó y cargó un pedido desde el ticket, se aplicó el cupón NOCHE15, se ajustaron cantidades en móvil y se registró la venta. También se revisó la navegación administrativa. Resultados en `tests/visual-v6-2-results.json`; capturas actuales en `preview/`.

La lógica y el backend de V6 se conservaron. Esta revisión no ejecutó operaciones en una cuenta real ni desplegó archivos a un alojamiento.

---

# Verificación V6

Se conservaron y ejecutaron las pruebas existentes de cobro, catálogo, convenios, permisos, reportes, edición de órdenes, caja auxiliar, cortes y empleado de la semana.

Nuevas pruebas:

- **v6-ui.cjs**: sesión existente, tabla administrativa y búsqueda, matriz de permisos, cliente con texto HTML escapado, pausa de promoción, cupón y registro de venta, bloqueo por permisos, compatibilidad cuando falta migración y reglas de descuentos.
- **v6-db.cjs**: migración sobre V5, creación de roles, asignación y revocación, rechazo de escalada de permisos, aislamiento entre negocios, identificadores únicos, precios del servidor, códigos inválidos, expiración, 2×1, límites de descuentos, combo, inmutabilidad de importes promocionales, registro de acceso y repetición de la migración.
- **visual-results.json**: revisión en Chromium de escritorio y móvil, navegación, creación de promoción y cobro con cupón; capturas en `preview/`.

Para repetir las pruebas de lógica:

```sh
cd tests
npm ci
npm test
```

Los archivos JSON en esta carpeta documentan el entorno de cada prueba. Los servicios de Supabase se simulan o se reproducen en PostgreSQL local; estos resultados no prueban que las políticas o funciones ya estén desplegadas en tu cuenta.
