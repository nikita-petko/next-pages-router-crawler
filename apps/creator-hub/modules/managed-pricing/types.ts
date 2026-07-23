export const MANAGED_PRICING_TABS = ['overview', 'pricing-activity', 'manage-items'] as const;
export type ManagedPricingTab = (typeof MANAGED_PRICING_TABS)[number];
