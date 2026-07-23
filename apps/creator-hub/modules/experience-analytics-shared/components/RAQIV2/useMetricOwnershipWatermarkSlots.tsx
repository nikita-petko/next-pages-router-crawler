import { useMemo } from 'react';
import type { ChartCardSlots } from '@rbx/analytics-ui';
import type { TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import {
  teamOwnershipByMetric,
  WatermarkQueryResourceType,
  type QuerySummary,
} from '@rbx/ownership-watermark';
import { getUIMetricsFromMetricLike, type MetricLike } from '../../types/ComputedMetric';
import FlagGatedOwnershipWatermark from '../FlagGatedOwnershipWatermark';

type WatermarkableQuerySpec = {
  resource: {
    id: number;
    type: string;
  };
  metric: MetricLike<TRAQIV2UIMetric> | null | undefined;
  breakdown?: readonly string[];
  filter?: readonly { dimension: string }[];
};

type WatermarkSlotInput = MetricLike<TRAQIV2UIMetric> | WatermarkableQuerySpec | null | undefined;

const getMetricOwnershipKey = (
  metric: MetricLike<TRAQIV2UIMetric> | null | undefined,
): TRAQIV2UIMetric | undefined => {
  if (!metric) {
    return undefined;
  }
  const metricKeys = getUIMetricsFromMetricLike(metric);
  return metricKeys.length === 1 ? metricKeys[0] : undefined;
};

function isWatermarkableQuerySpec(input: WatermarkSlotInput): input is WatermarkableQuerySpec {
  return typeof input === 'object' && input !== null && 'resource' in input && 'metric' in input;
}

function toWatermarkResourceType(resourceType: string): WatermarkQueryResourceType | null {
  switch (resourceType) {
    case WatermarkQueryResourceType.Universe:
      return WatermarkQueryResourceType.Universe;
    case WatermarkQueryResourceType.User:
      return WatermarkQueryResourceType.User;
    case WatermarkQueryResourceType.Group:
      return WatermarkQueryResourceType.Group;
    default:
      return null;
  }
}

const getTeamIdForMetric = (metricKey: TRAQIV2UIMetric): number | undefined =>
  teamOwnershipByMetric[metricKey];

function buildQuerySummary(input: WatermarkSlotInput): QuerySummary | undefined {
  if (!isWatermarkableQuerySpec(input)) {
    return undefined;
  }

  const metricKey = getMetricOwnershipKey(input.metric);
  const resourceType = toWatermarkResourceType(input.resource.type);
  if (
    !metricKey ||
    !resourceType ||
    !Number.isSafeInteger(input.resource.id) ||
    input.resource.id <= 0
  ) {
    return undefined;
  }

  const breakdownDimension = input.breakdown?.[0] ?? null;
  const filterDimension = input.filter?.[0]?.dimension ?? null;
  // RAQI chart specs always carry detail that schema v2 intentionally omits
  // (date range, granularity, and filter values), so every chart-derived query is partial.
  const truncated = true;

  return {
    teamId: getTeamIdForMetric(metricKey),
    resourceType,
    resourceId: input.resource.id,
    metric: metricKey,
    breakdownDimension,
    filterDimension,
    truncated,
  };
}

function getMetricFromInput(
  input: WatermarkSlotInput,
): MetricLike<TRAQIV2UIMetric> | null | undefined {
  return isWatermarkableQuerySpec(input) ? input.metric : input;
}

const useMetricOwnershipWatermarkSlots = (input: WatermarkSlotInput): ChartCardSlots => {
  const metricKey = getMetricOwnershipKey(getMetricFromInput(input));
  const query = useMemo(() => buildQuerySummary(input), [input]);
  return useMemo(
    () => ({
      watermark: <FlagGatedOwnershipWatermark metricKey={metricKey} query={query} />,
    }),
    [metricKey, query],
  );
};

export default useMetricOwnershipWatermarkSlots;
