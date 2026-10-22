/**
 * Pagos: DESACTIVADOS en esta versión.
 * La plataforma no cobra, no retiene fondos ni calcula comisiones.
 * Ver docs/PAGOS.md para el plan de integración segura (Stripe/Azul/CardNet).
 */
export type PaymentsProvider = "none" | "stripe";

export function paymentsProvider(): PaymentsProvider {
  const p = process.env.PAYMENTS_PROVIDER;
  return p === "stripe" && process.env.STRIPE_SECRET_KEY ? "stripe" : "none";
}

export function paymentsEnabled() {
  // Aunque haya claves, la integración aún no está implementada: se mantiene desactivada.
  return false;
}
