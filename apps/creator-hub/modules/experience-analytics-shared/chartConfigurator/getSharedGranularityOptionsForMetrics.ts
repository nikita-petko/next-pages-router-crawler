import type {
  RAQIV2MetricGranularity,
  TRAQIV2Dimension,
  TRAQIV2UIMetric,
} from '@rbx/creator-hub-analytics-config';
import getGranularityOptionsForMetric from './getGranularityOptionsForMetric';

const getSharedGranularityOptionsForMetrics = ({
  metrics,
  startDate,
  endDate,
  breakdown,
}: {
  metrics: readonly TRAQIV2UIMetric[];
  startDate: Date;
  endDate: Date;
  breakdown?: readonly TRAQIV2Dimension[];
}): RAQIV2MetricGranularity[] => {
  const [firstMetricAllowedGranularities = [], ...otherMetricAllowedGranularities] = metrics.map(
    (metric) =>
      getGranularityOptionsForMetric({
        metric,
        startDate,
        endDate,
        breakdown,
      })
        .filter(({ isAllowed }) => isAllowed)
        .map((option) => option.granularity),
  );

  return firstMetricAllowedGranularities.filter((candidateGranularity) =>
    otherMetricAllowedGranularities.every((granularitySet) =>
      granularitySet.includes(candidateGranularity),
    ),
  );
};

export default getSharedGranularityOptionsForMetrics;
