/* istanbul ignore file */
import { managedPricingKeys } from '@modules/managed-pricing/queries/constants';

export const DEFAULT_PAGE_SIZE = 400 as number;

export const DEFAULT_RETRIES = 3 as number;
export const DEFAULT_STALE_TIME = 60 * 60 * 1000;

/** Base query keys for hard-coded prices */
export const hardCodedPricesKeys = {
  base: (universeId: number) =>
    [...managedPricingKeys.base(universeId), 'hard-coded-prices'] as const,
  summary: (universeId: number, params?: { mock?: boolean }) =>
    [...hardCodedPricesKeys.base(universeId), 'summary', params] as const,
  listAll: (
    universeId: number,
    scanJobId?: string,
    params?: { pageSize?: number; mock?: boolean },
  ) => [...hardCodedPricesKeys.base(universeId), 'listAll', scanJobId, params] as const,
} as const;
