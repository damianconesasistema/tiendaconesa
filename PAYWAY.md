# Integración Payway (Decidir Plus)

## Estado actual

- ✅ Modelo `Order` extendido con campos de pago (`paymentMethod`, `paywayStatus`, `paywayPaymentId`, `paywayCardBrand`, `paywayCardLast4`, etc.)
- ✅ Migration `3_add_payway_fields`
- ✅ SDK Node instalado (`sdk-node-payway`)
- ✅ Wrapper del SDK: [src/lib/payway.ts](src/lib/payway.ts)
- ✅ Endpoint de pago: `POST /api/payway/pay`
- ⏳ Checkout UI con decidir.js (próximo)
- ⏳ Páginas de éxito / error (próximo)

## Variables de entorno (Railway)

Agregar en Railway → Variables:

```
PAYWAY_ENV=developer           # o "production" cuando esté listo
PAYWAY_PUBLIC_KEY=<tu-public-key>
PAYWAY_PRIVATE_KEY=<tu-private-key>
PAYWAY_COMPANY=Sanitarios Conesa
```

### Credenciales de sandbox (temporales para probar)

Payway publica credenciales de sandbox en los README de sus SDKs oficiales:
https://github.com/payway-ar/sdk-node-ventaonline

Copialas de ahí y pegalas en Railway para probar sin tener alta real. Las credenciales reales las obtenés desde el portal **Decidir Plus** una vez que tengas:
- CUIT activo + inscripto en Ingresos Brutos
- CBU asociada al CUIT
- Alta de establecimiento tipo E-commerce en el Portal Payway

### Tarjetas de prueba (sandbox)

- Visa: `4507 9900 0000 4905` · CVV `123` · Fecha cualquiera futura
- Mastercard: `5299 9100 0000 0024` · CVV `123`

## Flujo de pago

```
1. Cliente completa checkout → elige "Tarjeta"
2. Frontend carga decidir.js con la PUBLIC key
3. Cliente ingresa datos → decidir.js tokeniza contra Payway (NO pasa por nuestro server)
4. Frontend envía token + orderNumber a POST /api/payway/pay
5. Backend llama payWithToken() del SDK con la PRIVATE key
6. Backend persiste el resultado en la Order
7. Response → redirect a /tienda/checkout/exito o /tienda/checkout/error
```

## Qué sigue

1. **UI de pago**: componente de tarjeta usando decidir.js
2. **Opción en checkout**: radio "Transferencia / Efectivo en local / Tarjeta"
3. **Páginas éxito/error**
4. **Panel admin**: mostrar `paywayStatus`, `paywayPaymentId`, últimos 4 en el detalle del pedido
