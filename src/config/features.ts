/**
 * Feature flags — flip to `true` to reactivate each system.
 * Backend guards and permission checks read from here.
 */
export const FEATURE_FLAGS = {
  /** Master switch: listing caps, grace period enforcement, subscription checks */
  PAYMENTS_ENABLED: false,
  /** Boost payment flow */
  BOOST_ENABLED: false,
  /** Subscription purchase flow */
  SUBSCRIPTIONS_ENABLED: false,
} as const;
