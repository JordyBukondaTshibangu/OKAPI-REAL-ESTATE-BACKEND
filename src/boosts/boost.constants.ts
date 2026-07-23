export const BOOST_PLANS = [
  { id: "week",   label: "7 jours",  durationDays: 7,  amount: 5,  recommended: false },
  { id: "biweek", label: "15 jours", durationDays: 15, amount: 9,  recommended: true  },
  { id: "month",  label: "30 jours", durationDays: 30, amount: 15, recommended: false },
] as const;

export type BoostPlan = typeof BOOST_PLANS[number];

export const PAYMENT_METHODS = [
  { id: "ORANGE_MONEY", label: "Orange Money",       number: process.env.PAYMENT_ORANGE_NUMBER  ?? "+243 XXX XXX XXX" },
  { id: "MTN_MONEY",    label: "MTN Money",           number: process.env.PAYMENT_MTN_NUMBER     ?? "+243 XXX XXX XXX" },
  { id: "AIRTEL_MONEY", label: "Airtel Money",        number: process.env.PAYMENT_AIRTEL_NUMBER  ?? "+243 XXX XXX XXX" },
  { id: "MPESA",        label: "M-Pesa (Vodacom)",   number: process.env.PAYMENT_MPESA_NUMBER   ?? "+243 XXX XXX XXX" },
] as const;

/** Reference shown to agent so admin can match the payment. */
export function generatePaymentReference(propertyId: string): string {
  return `BOOST-${propertyId.slice(-6).toUpperCase()}`;
}
