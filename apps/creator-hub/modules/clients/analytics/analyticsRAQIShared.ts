import { EnumType } from '@modules/miscellaneous/common/utils/enumUtils';
import { FilterOperation as APIFilterOperation } from '@rbx/client-analytics-query-gateway/v1';
import {
  RAQIV2AggregationType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
  RAQIV2PercentileType,
  RAQIV2UIPseudoDimension,
  TRAQIV2APIMetric,
  TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import { RAQIClientOptions } from './RAQIPolling';

type TDimensionToBreakdownValues = EnumType<string>;

export type FilterOperation = Exclude<APIFilterOperation, typeof APIFilterOperation.Invalid>;

export type QueryFilter = {
  dimension: RAQIV2Dimension;
  values: Array<TDimensionToBreakdownValues[string]>;
  operation?: FilterOperation;
};

export type UIQueryFilter =
  | {
      dimension: RAQIV2UIPseudoDimension.PercentileType;
      values: RAQIV2PercentileType[];
    }
  | {
      dimension: RAQIV2UIPseudoDimension.AggregationType;
      values: RAQIV2AggregationType[];
    };

export type TQueryFilter = QueryFilter | UIQueryFilter;

export type QueryRequestBase = {
  granularity: RAQIV2MetricGranularity;
  breakdown?: readonly TRAQIV2Dimension[];
  filter?: readonly TQueryFilter[];
  limit?: number;
};

export enum ChartResourceType {
  Group = 'Group',
  Universe = 'Universe',
  User = 'User',
}

type TCanonicalCreatorAnalyticsResourceType = 'Universe' | 'Creator' | 'Group';

const chartResourceTypeToCanonicalCreatorAnalyticsResourceType: Record<
  ChartResourceType,
  TCanonicalCreatorAnalyticsResourceType
> = {
  [ChartResourceType.Universe]: 'Universe',
  [ChartResourceType.User]: 'Creator',
  [ChartResourceType.Group]: 'Group',
};

/**
 * Maps Creator Hub chart resource types to target API resource-type enums that
 * expose the canonical Creator Analytics keys: Universe, Creator, Group.
 *
 * Supports AnalyticsQueryGatewayAPIResourceType, AceResourceType, and the benchmark-related ResourceType.
 */
export const mapChartResourceTypeToTargetResourceType = <
  TTargetResourceTypeEnum extends Record<TCanonicalCreatorAnalyticsResourceType, unknown>,
>(
  resourceType: ChartResourceType,
  targetResourceTypeEnum: TTargetResourceTypeEnum,
): TTargetResourceTypeEnum[TCanonicalCreatorAnalyticsResourceType] => {
  const canonicalResourceType =
    chartResourceTypeToCanonicalCreatorAnalyticsResourceType[resourceType];
  return targetResourceTypeEnum[canonicalResourceType];
};

export type ChartResource = {
  id: number;
  type: ChartResourceType;
  isLoading?: boolean;
};

export type RAQIV2CombinedAPIQueryRequestBase = QueryRequestBase & {
  metric: TRAQIV2APIMetric;
  startTime: Date;
  endTime: Date;
  breakdown?: readonly RAQIV2Dimension[];
  filter?: readonly QueryFilter[];
};

export type RAQIV2CombinedAPIQueryRequest = RAQIV2CombinedAPIQueryRequestBase & {
  resource: ChartResource;
};

export const RAQIV2WithPollingDefaults: RAQIClientOptions = {
  maxAttempts: 20,
  intialPollingInterval: 1500, // 1.5 seconds
  maxAccumulativeDelayToStartBackoff: 4500, // 4.5 seconds
};

export const RAQIV2MockUniverseResource = {
  type: ChartResourceType.Universe,

  /**
   * === uninitializedUniverseId, but this should never be used except in tests...
   * And, tragically, useDangerousRAQIV2PredefinedPreControlComponentsBundle...
   */
  id: -1,
  isLoading: false,
};
