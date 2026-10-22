# Monetización y pagos

## Estado actual

**No hay pagos, suscripciones ni comisiones implementados**, a propósito. `src/lib/payments.ts` devuelve siempre `paymentsEnabled() === false` y la interfaz lo indica. Los precios de servicios se marcan como «precio demo» mientras `price_is_demo = true`.

El registro básico de artistas es y seguirá siendo gratuito.

## Lo que ya está preparado en la arquitectura

| Fuente de ingresos | Base existente |
|---|---|
| Servicios profesionales | `services` (precio, moneda, proveedor, estado) + `service_inquiries` con estados; panel `/admin/servicios` y `/admin/proveedores` |
| Campañas promocionales y patrocinios | `features.kind = 'patrocinado'`, `is_sponsored`/`sponsor_name` en oportunidades, eventos y artículos; etiquetado obligatorio |
| Comisiones por contrataciones | `booking_requests` con estados y presupuesto; falta acuerdo legal y pasarela |
| Eventos y showcases | `events` (con `ticket_url` externo) |
| Membresías profesionales | Pendiente: añadir tabla `subscriptions` (plan, estado, periodo) ligada a `users` |
| Leads de marcas | `leads` + `/admin/contactos` |

## Cómo habilitar pagos de forma segura (propuesta)

1. **Requisitos previos (no técnicos)**: entidad legal, cuenta comercial, términos de servicio y de reembolso revisados por un abogado, política fiscal (ITBIS) y acuerdo escrito con proveedores y artistas sobre comisiones.
2. **Pasarela**: Stripe (si está disponible para la entidad) o una pasarela local (Azul, CardNet). Usar **Checkout alojado** por la pasarela para no manejar datos de tarjeta (PCI-DSS SAQ-A).
3. **Variables solo de servidor**: `PAYMENTS_PROVIDER=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. Nunca con prefijo `NEXT_PUBLIC_`.
4. **Modelo de datos**: tabla `payments` (id externo, importe, moneda, estado, `service_inquiry_id`/`booking_id`, usuario) y `payouts` si se reparte dinero a proveedores (Stripe Connect o equivalente).
5. **Flujo**: crear la sesión de checkout en una acción de servidor tras comprobar permisos → redirigir → confirmar **solo** mediante webhook firmado (`/api/webhooks/stripe`, verificación de firma, idempotencia por id de evento) → actualizar estado.
6. **Contrataciones**: no cobrar al aceptar una solicitud. Primero contrato firmado; si se gestionan anticipos, retenerlos con un proveedor que soporte custodia y reembolsos, con política de cancelación pública.
7. **Pruebas**: modo test de la pasarela, pruebas de webhooks con firmas inválidas/duplicadas, y auditoría en `audit_log`.
8. Solo entonces cambiar `paymentsEnabled()`.
