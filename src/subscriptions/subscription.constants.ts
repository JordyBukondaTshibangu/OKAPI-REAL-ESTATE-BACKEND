export const SUBSCRIPTION_PLANS = [
  { id: "PRO",    tier: "PRO"    as const, label: "Pro",    amount: 15, listingCap: null, description: "Annonces illimitées + statistiques" },
  { id: "AGENCY", tier: "AGENCY" as const, label: "Agence", amount: 50, listingCap: null, description: "Tout Pro + profil agence + équipe" },
] as const;

export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[number];

export const PAYMENT_METHODS = [
  { id: "ORANGE_MONEY", label: "Orange Money",     number: process.env.PAYMENT_ORANGE_NUMBER  ?? "+243 XXX XXX XXX" },
  { id: "MTN_MONEY",    label: "MTN Money",         number: process.env.PAYMENT_MTN_NUMBER     ?? "+243 XXX XXX XXX" },
  { id: "AIRTEL_MONEY", label: "Airtel Money",      number: process.env.PAYMENT_AIRTEL_NUMBER  ?? "+243 XXX XXX XXX" },
  { id: "MPESA",        label: "M-Pesa (Vodacom)",  number: process.env.PAYMENT_MPESA_NUMBER   ?? "+243 XXX XXX XXX" },
] as const;

/** Reference shown to agent so admin can match the payment. */
export function generateSubscriptionReference(agentId: string, tier: string): string {
  return `${tier.slice(0, 3).toUpperCase()}-${agentId.slice(-6).toUpperCase()}`;
}
