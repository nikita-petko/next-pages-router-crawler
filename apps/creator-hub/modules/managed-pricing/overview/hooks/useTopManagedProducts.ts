import { useMemo } from 'react';
import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
  RAQIV2ProductType,
} from '@rbx/creator-hub-analytics-config';
import { RAQIV2ChartResourceType, type RAQIV2MetricValue } from '@modules/clients/analytics';
import type { BatchGetDeveloperProductConfigsResponse } from '@modules/clients/developerProducts';
import type { BatchGetGamePassConfigsResponse } from '@modules/clients/passes';
import { useBatchGetDeveloperProductConfigs } from '@modules/developer-products/queries/useBatchGetDeveloperProductConfigs';
import useRAQIV2Request from '@modules/experience-analytics-shared/hooks/useRAQIV2Request';
import type { RAQIV2UIQueryRequest } from '@modules/experience-analytics-shared/types/RAQIV2UIQueryRequest';
import parseProductKeyBreakdownValue, {
  type ParsedProductKey,
} from '@modules/experience-monetization/utils/parseProductKeyBreakdownValue';
import { useMonetizationFlags } from '@modules/monetization-shared/flags/useMonetizationFlags';
import { useBatchGetGamePassConfigs } from '@modules/passes/queries/useBatchGetGamePassConfigs';
import {
  transformDeveloperProducts,
  transformGamePasses,
} from '../../manage-items/utils/transformManagedProducts';
import type { ManagedProduct, ManagedProductWithRevenue } from '../../types';
import { DEFAULT_AGGREGATION_DURATION_MS } from '../constants';
import getManagedPricingAnalyticsTimeSpec from '../getManagedPricingAnalyticsTimeSpec';
import { useMockTopManagedProducts } from './useMockTopManagedProducts';

type UseTopManagedProductsParams = {
  universeId: number;
  limit: number;
  // What time frame from now to look backwards to aggregate the data for top products
  aggregationDurationMs?: number;
};

type ParsedProductWithRevenue = ParsedProductKey & {
  revenueLast30Days: number;
};

function parseProductWithRevenue(mv: RAQIV2MetricValue): ParsedProductWithRevenue | null {
  const parsedProduct = parseProductKeyBreakdownValue(mv.breakdownValue ?? []);
  // There should always be exactly one data point since we queried with no granularity, so it should all be aggregated into one value
  const revenueLast30DaysRaw = mv.dataPoints?.[0]?.value ?? null;
  // oxlint-disable-next-line typescript/prefer-nullish-coalescing -- use null if zero
  const revenueLast30Days = revenueLast30DaysRaw || null;
  if (!parsedProduct || !revenueLast30Days || Number.isNaN(revenueLast30Days)) {
    return null;
  }
  return {
    ...parsedProduct,
    revenueLast30Days,
  };
}

/** Transform batch get response to map for top developer products */
const transformDeveloperProductsResponse = (
  response: BatchGetDeveloperProductConfigsResponse,
): Map<number, ManagedProduct> => {
  return new Map(transformDeveloperProducts(response.developerProducts).map((p) => [p.id, p]));
};

/** Transform batch get response to map for top passes */
const transformGamePassesResponse = (
  response: BatchGetGamePassConfigsResponse,
): Map<number, ManagedProduct> => {
  return new Map(transformGamePasses(response.gamePasses).map((p) => [p.id, p]));
};

/**
 * Hook to get the top managed products for a universe
 * @param universeId - The ID of the universe
 * @param limit - The total number of top products to return (may return less than the limit if there are not enough products in the universe)
 * @param aggregationDurationMs - Duration to aggregate sales data for to calculate the top products
 * @returns The top managed products, loading state, and error state
 */
export function useTopManagedProducts({
  universeId,
  limit,
  aggregationDurationMs = DEFAULT_AGGREGATION_DURATION_MS,
}: UseTopManagedProductsParams) {
  const { mockManagedPricingSummary } = useMonetizationFlags('mockManagedPricingSummary');
  const timeSpec = useMemo(
    () => getManagedPricingAnalyticsTimeSpec(aggregationDurationMs),
    [aggregationDurationMs],
  );
  const mockResult = useMockTopManagedProducts({
    universeId,
    limit,
    enabled: mockManagedPricingSummary ?? false,
  });

  const topProductsRequest: RAQIV2UIQueryRequest = useMemo(
    () => ({
      resource: { type: RAQIV2ChartResourceType.Universe, id: universeId },
      metric: RAQIV2Metric.ItemMonetizationRevenue,
      granularity: RAQIV2MetricGranularity.None,
      breakdown: [RAQIV2Dimension.ProductKey],
      filter: [
        {
          dimension: RAQIV2Dimension.ProductType,
          values: [RAQIV2ProductType.DevProduct, RAQIV2ProductType.GamePass],
        },
      ],
      limit,
      timeSpec,
    }),
    [universeId, limit, timeSpec],
  );

  const {
    data: topProductsData,
    isDataLoading: isTopProductsLoading,
    isResponseFailed: isTopProductsFailed,
  } = useRAQIV2Request(topProductsRequest);

  const parsedProducts = useMemo(() => {
    const values = topProductsData?.response?.values;
    if (!values?.length) {
      return [];
    }
    return values.map((mv) => parseProductWithRevenue(mv)).filter((parsed) => !!parsed);
  }, [topProductsData]);

  // Product ID, not developer product target ID for developer products
  // Game pass ID for game passes
  const [devProductIds, gamePassIds] = useMemo(() => {
    return [
      parsedProducts.filter((p) => p.subtype === 'devproduct').map((p) => p.itemId),
      parsedProducts.filter((p) => p.subtype === 'gamepass').map((p) => p.itemId),
    ];
  }, [parsedProducts]);

  const {
    data: devProductConfigs,
    isLoading: isDevProductsLoading,
    isError: isDevProductsError,
  } = useBatchGetDeveloperProductConfigs(
    { universeId, productIds: devProductIds },
    { select: transformDeveloperProductsResponse, enabled: devProductIds.length > 0 },
  );

  const {
    data: gamePassConfigs,
    isLoading: isGamePassesLoading,
    isError: isGamePassesError,
  } = useBatchGetGamePassConfigs(
    { universeId, gamePassIds },
    { select: transformGamePassesResponse, enabled: gamePassIds.length > 0 },
  );

  const data: ManagedProductWithRevenue[] = useMemo(
    () =>
      parsedProducts
        .map((parsed) => {
          let product: ManagedProduct | undefined;
          if (parsed.subtype === 'devproduct') {
            product = devProductConfigs?.get(parsed.itemId);
          } else if (parsed.subtype === 'gamepass') {
            product = gamePassConfigs?.get(parsed.itemId);
          }
          return product ? { ...product, revenueLast30Days: parsed.revenueLast30Days } : undefined;
        })
        .filter((config) => config !== undefined),
    [parsedProducts, devProductConfigs, gamePassConfigs],
  );

  const isLoading = isTopProductsLoading || isDevProductsLoading || isGamePassesLoading;
  const isError = isTopProductsFailed || isDevProductsError || isGamePassesError;

  if (mockManagedPricingSummary) {
    return mockResult;
  }

  return {
    data,
    isLoading,
    isError,
  };
}
