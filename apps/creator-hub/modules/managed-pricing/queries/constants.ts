/** The initial number of products to prefetch on first load. */
export const INITIAL_FETCH_TOTAL = 3000 as number;

/** The default page size for the developer product list query */
export const DEFAULT_PAGE_SIZE = 400 as number;

export const DEFAULT_RETRIES = 3 as number;

/** Stale time for managed pricing event list queries. One hour so the tab refetches periodically. */
export const DEFAULT_STALE_TIME = 60 * 60 * 1000;

/** Base query keys for managed pricing */
export const managedPricingKeys = {
  base: (universeId: number) => ['managed-pricing', universeId] as const,
  giftingTradingStatus: (universeId: number) =>
    [...managedPricingKeys.base(universeId), 'gifting-trading-status'] as const,
  managedPricingStatus: (universeId: number) =>
    [...managedPricingKeys.base(universeId), 'status'] as const,
  managedPricingSummary: (universeId: number, params?: { mock?: boolean }) =>
    [...managedPricingKeys.base(universeId), 'summary', params] as const,
  managedPricingMetadata: (universeId: number) =>
    [...managedPricingKeys.base(universeId), 'metadata'] as const,
} as const;

/** Query keys for managed pricing events */
export const managedPricingEventKeys = {
  all: (universeId: number) => [...managedPricingKeys.base(universeId), 'events'] as const,
  listAll: (universeId: number, params?: { pageSize?: number; mock?: boolean }) =>
    [...managedPricingEventKeys.all(universeId), 'listAll', params] as const,
  event: (universeId: number, eventId: string, params?: { mock?: boolean }) =>
    [...managedPricingEventKeys.all(universeId), 'event', eventId, params] as const,
} as const;

/** Query keys for managed pricing experiments */
export const managedPricingExperimentKeys = {
  experiment: (universeId: number, experimentId: string) =>
    [...managedPricingKeys.base(universeId), 'experiments', experimentId] as const,
  summary: (universeId: number, experimentId: string, params?: { mock?: boolean }) =>
    [
      ...managedPricingExperimentKeys.experiment(universeId, experimentId),
      'summary',
      params,
    ] as const,
  productDetails: (
    universeId: number,
    experimentId: string,
    params?: { pageSize?: number; mock?: boolean },
  ) =>
    [
      ...managedPricingExperimentKeys.experiment(universeId, experimentId),
      'products',
      params,
    ] as const,
} as const;
