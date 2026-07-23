export const DEFAULT_RETRIES = 3;

/** Query keys for gifting trading status */
export const queryKeys = {
  giftingTradingStatus: (universeId: number) => [universeId, 'gifting-trading-status'] as const,
  managedPricingStatus: (universeId: number) => [universeId, 'managed-pricing-status'] as const,
  managedPricingSummary: (universeId: number) => [universeId, 'managed-pricing-summary'] as const,
  hardCodedPrices: (universeId: number) => [universeId, 'hard-coded-prices'] as const,
  hardCodedPricesSummary: (universeId: number) =>
    [...queryKeys.hardCodedPrices(universeId), 'summary'] as const,
  experiment: (universeId: number, experimentId: string) =>
    [universeId, 'experiments', experimentId] as const,
  experimentSummary: (universeId: number, experimentId: string) =>
    [...queryKeys.experiment(universeId, experimentId), 'summary'] as const,
} as const;
