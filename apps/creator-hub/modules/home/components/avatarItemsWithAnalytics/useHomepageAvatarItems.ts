import { useCallback, useMemo } from 'react';
import type { RobloxCatalogApiMultigetItemDetailsRequestItem } from '@rbx/client-catalog/v1';
import { RobloxCatalogApiMultigetItemDetailsRequestItemItemTypeEnum } from '@rbx/client-catalog/v1';
import { subDays } from '@rbx/core';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import type {
  AvatarItemDetail,
  RAQIV2BreakdownValue,
  RAQIV2MetricValue,
} from '@modules/clients/analytics';
import { OwnerType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import {
  AvatarItemTargetType,
  AvatarItemType,
  AvatarItemTypeToTargetType,
} from '@modules/clients/analytics/avatarItemTypes';
import catalogClient from '@modules/clients/catalog';
import type { TUseOwnerResult } from '@modules/experience-analytics-shared/context/useOwner';
import useMappedApiRequest from '@modules/experience-analytics-shared/hooks/useMappedApiRequest';
import useRAQIV2Request from '@modules/experience-analytics-shared/hooks/useRAQIV2Request';
import type { RAQIV2UIQueryRequest } from '@modules/experience-analytics-shared/types/RAQIV2UIQueryRequest';
import {
  FetchComparisonSeriesMode,
  type MakeRAQIV2RequestOptions,
} from '@modules/experience-analytics-shared/utils/makeRAQIV2Request';

type FetchedOwner = Extract<TUseOwnerResult, { isFetched: true }>;

// Number of trailing days of metrics shown on the homepage tiles.
const METRICS_DATE_RANGE_DAYS = 7;
// Top items are selected/ordered by revenue; sales are looked up per item from
// a wider result set so the revenue leaders are virtually always covered.
const TOP_ITEMS_LIMIT = 10;
const SALES_LOOKUP_LIMIT = 500;

const AVATAR_ITEM_BREAKDOWN = [
  RAQIV2Dimension.AvatarItemId,
  RAQIV2Dimension.AvatarItemTargetType,
] as const;

type ParsedAvatarItemKey = {
  itemId: number;
  targetType: AvatarItemTargetType;
  keyString: string;
};

type CatalogItemMeta = {
  name: string;
  price?: number;
  isOnSale: boolean;
  totalQuantity?: string;
  assetType?: number;
  bundleType?: number;
};

const keyToString = (itemId: number, targetType: AvatarItemTargetType): string =>
  `${targetType}_${itemId}`;

const normalizeTargetTypeFromBreakdown = (value: string): AvatarItemTargetType =>
  value.startsWith('Bundle') ? AvatarItemTargetType.Bundle : AvatarItemTargetType.AssetItem;

const parseAvatarItemKey = (
  breakdownValues: RAQIV2BreakdownValue[] | null | undefined,
): ParsedAvatarItemKey | undefined => {
  const idValue = breakdownValues?.find((b) => b.dimension === RAQIV2Dimension.AvatarItemId)?.value;
  const targetTypeValue = breakdownValues?.find(
    (b) => b.dimension === RAQIV2Dimension.AvatarItemTargetType,
  )?.value;
  if (!idValue || !targetTypeValue) {
    return undefined;
  }
  const itemId = parseInt(idValue, 10);
  if (Number.isNaN(itemId)) {
    return undefined;
  }
  const targetType = normalizeTargetTypeFromBreakdown(targetTypeValue);
  return { itemId, targetType, keyString: keyToString(itemId, targetType) };
};

const getMetricValue = (metricValue: RAQIV2MetricValue): number | null =>
  metricValue.dataPoints?.[0]?.value ?? null;

// Builds a map of breakdown key -> metric value for a RAQI V2 response.
const toMetricMap = (values: RAQIV2MetricValue[] | null | undefined): Map<string, number> => {
  const map = new Map<string, number>();
  values?.forEach((metricValue) => {
    const key = parseAvatarItemKey(metricValue.breakdownValue);
    const value = getMetricValue(metricValue);
    if (key && value !== null) {
      map.set(key.keyString, value);
    }
  });
  return map;
};

const isAvatarItemType = (value: string): value is AvatarItemType =>
  value in AvatarItemTypeToTargetType;

// Catalog/AvatarItemType use different bundle subtype conventions, but the tile
// only needs asset-vs-bundle to pick the thumbnail. Synthesize an AvatarItemType
// whose prefix maps correctly, falling back to a generic bundle/asset type.
const toAvatarItemType = (
  targetType: AvatarItemTargetType,
  assetType?: number,
  bundleType?: number,
): AvatarItemType => {
  const candidate =
    targetType === AvatarItemTargetType.Bundle
      ? `Bundle_${bundleType ?? 0}`
      : `Asset_${assetType ?? 2}`;
  if (isAvatarItemType(candidate)) {
    return candidate;
  }
  return targetType === AvatarItemTargetType.Bundle
    ? AvatarItemType.GenericBundle
    : AvatarItemType.TShirt;
};

const getCatalogItemDetailsMap = async (
  keys: ParsedAvatarItemKey[],
): Promise<Map<string, CatalogItemMeta>> => {
  const request: RobloxCatalogApiMultigetItemDetailsRequestItem[] = keys.map((key) => ({
    id: key.itemId,
    itemType:
      key.targetType === AvatarItemTargetType.Bundle
        ? RobloxCatalogApiMultigetItemDetailsRequestItemItemTypeEnum.NUMBER_2
        : RobloxCatalogApiMultigetItemDetailsRequestItemItemTypeEnum.NUMBER_1,
  }));

  const response = await catalogClient.postItemDetails(request);
  const map = new Map<string, CatalogItemMeta>();
  response?.data?.forEach((item) => {
    if (item.id === undefined) {
      return;
    }
    const targetType = item.bundleType
      ? AvatarItemTargetType.Bundle
      : AvatarItemTargetType.AssetItem;
    map.set(keyToString(item.id, targetType), {
      name: item.name ?? '',
      price: item.price ?? undefined,
      isOnSale: !item.isOffSale,
      totalQuantity: item.totalQuantity ? String(item.totalQuantity) : undefined,
      assetType: item.assetType ?? undefined,
      bundleType: item.bundleType ?? undefined,
    });
  });
  return map;
};

export type UseHomepageAvatarItemsResult = {
  data: AvatarItemDetail[];
  comparisonData: Map<string, AvatarItemDetail>;
  isDataLoading: boolean;
};

/**
 * Homepage Avatar Items data, sourced from the RAQI V2 analytics gateway (the
 * same data source as the analytics Avatar tab) for sales/revenue + trend, and
 * the catalog API for item metadata (name/price/on-sale/limited).
 */
const useHomepageAvatarItems = (owner: FetchedOwner): UseHomepageAvatarItemsResult => {
  const { startTime, endTime } = useMemo(() => {
    const now = new Date();
    return { startTime: subDays(now, METRICS_DATE_RANGE_DAYS), endTime: now };
  }, []);

  const resource = useMemo(
    () => ({
      type:
        owner.ownerType === OwnerType.Group
          ? RAQIV2ChartResourceType.Group
          : RAQIV2ChartResourceType.User,
      id: owner.ownerId,
    }),
    [owner.ownerType, owner.ownerId],
  );

  const requestOptions: MakeRAQIV2RequestOptions = useMemo(
    () => ({
      fetchComparison: {
        mode: FetchComparisonSeriesMode.Separate,
        granularity: RAQIV2MetricGranularity.None,
      },
      // The avatar item breakdown would otherwise cause stripFetchComparisonForBreakdown
      // to drop the comparison fetch, leaving the trend chips without previous-period data.
      allowComparisonWithBreakdown: true,
    }),
    [],
  );

  const revenueRequest: RAQIV2UIQueryRequest = useMemo(
    () => ({
      resource,
      metric: RAQIV2Metric.ItemTotalCreatorEarning,
      granularity: RAQIV2MetricGranularity.None,
      breakdown: AVATAR_ITEM_BREAKDOWN,
      limit: TOP_ITEMS_LIMIT,
      timeSpec: { rangeType: RAQIV2DateRangeType.Custom, startTime, endTime },
    }),
    [resource, startTime, endTime],
  );

  const salesRequest: RAQIV2UIQueryRequest = useMemo(
    () => ({
      resource,
      metric: RAQIV2Metric.ItemTotalTransactionCount,
      granularity: RAQIV2MetricGranularity.None,
      breakdown: AVATAR_ITEM_BREAKDOWN,
      limit: SALES_LOOKUP_LIMIT,
      timeSpec: { rangeType: RAQIV2DateRangeType.Custom, startTime, endTime },
    }),
    [resource, startTime, endTime],
  );

  const { data: revenueData, isDataLoading: isRevenueLoading } = useRAQIV2Request(
    revenueRequest,
    requestOptions,
  );
  const { data: salesData } = useRAQIV2Request(salesRequest, requestOptions);

  // Ordered top items (by revenue) with their current/previous revenue.
  const orderedItems = useMemo(() => {
    return (revenueData?.response?.values ?? [])
      .map((metricValue) => {
        const key = parseAvatarItemKey(metricValue.breakdownValue);
        if (!key) {
          return undefined;
        }
        return { key, revenue: getMetricValue(metricValue) };
      })
      .filter((item): item is { key: ParsedAvatarItemKey; revenue: number | null } => !!item);
  }, [revenueData]);

  const revenueComparisonMap = useMemo(
    () => toMetricMap(revenueData?.comparisonResponse?.values),
    [revenueData],
  );
  const salesMap = useMemo(() => toMetricMap(salesData?.response?.values), [salesData]);
  const salesComparisonMap = useMemo(
    () => toMetricMap(salesData?.comparisonResponse?.values),
    [salesData],
  );

  const catalogKeyStrings = useMemo(
    () => orderedItems.map((item) => item.key.keyString),
    [orderedItems],
  );

  // Stable across renders so useMappedApiRequest caches by id instead of
  // refetching every render. Keys are self-describing (`${targetType}_${itemId}`).
  const fetchCatalogDetails = useCallback(
    async (keyStrings: string[]): Promise<Map<string, CatalogItemMeta>> => {
      const keys = keyStrings
        .map((keyString): ParsedAvatarItemKey | undefined => {
          const itemId = parseInt(keyString.split('_')[1] ?? '', 10);
          if (Number.isNaN(itemId)) {
            return undefined;
          }
          const targetType = keyString.startsWith('Bundle')
            ? AvatarItemTargetType.Bundle
            : AvatarItemTargetType.AssetItem;
          return { itemId, targetType, keyString };
        })
        .filter((key): key is ParsedAvatarItemKey => key !== undefined);
      if (keys.length === 0) {
        return new Map<string, CatalogItemMeta>();
      }
      return getCatalogItemDetailsMap(keys);
    },
    [],
  );

  const { data: catalogData, isDataLoading: isCatalogLoading } = useMappedApiRequest<
    string,
    CatalogItemMeta
  >(catalogKeyStrings, fetchCatalogDetails);

  const buildItem = useCallback(
    (
      key: ParsedAvatarItemKey,
      revenue: number | null,
      salesCount: number | null,
    ): AvatarItemDetail => {
      const meta = catalogData.get(key.keyString) ?? null;
      return {
        targetId: key.itemId,
        targetIdString: String(key.itemId),
        name: meta?.name ?? '',
        price: meta?.price,
        isOnSale: meta?.isOnSale ?? false,
        salesCount: salesCount ?? undefined,
        revenue: revenue ?? undefined,
        totalQuantity: meta?.totalQuantity,
        targetType: toAvatarItemType(key.targetType, meta?.assetType, meta?.bundleType),
      };
    },
    [catalogData],
  );

  const data = useMemo(
    () =>
      orderedItems.map((item) =>
        buildItem(item.key, item.revenue, salesMap.get(item.key.keyString) ?? null),
      ),
    [orderedItems, salesMap, buildItem],
  );

  const comparisonData = useMemo(() => {
    const map = new Map<string, AvatarItemDetail>();
    orderedItems.forEach((item) => {
      const detail = buildItem(
        item.key,
        revenueComparisonMap.get(item.key.keyString) ?? null,
        salesComparisonMap.get(item.key.keyString) ?? null,
      );
      map.set(detail.targetIdString ?? '', detail);
    });
    return map;
  }, [orderedItems, revenueComparisonMap, salesComparisonMap, buildItem]);

  return {
    data,
    comparisonData,
    isDataLoading: isRevenueLoading || isCatalogLoading,
  };
};

export default useHomepageAvatarItems;
