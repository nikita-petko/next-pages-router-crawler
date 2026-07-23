import { AnalyticsQueryParams } from '@modules/charts-generic';
import { RAQIV2Metric, RAQIV2UIMetric, TRAQIV2APIMetric } from '@rbx/creator-hub-analytics-config';
import { useMemo } from 'react';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import getAPIMetricFromUIMetric from '../utils/getAPIMetricFromUIMetric';
import { useRAQIV2ConfigurablePageSurfaceContextMetricsOrNull } from '../components/RAQIV2/layout/RAQIV2ConfigurablePageContext';

const metricParam = [AnalyticsQueryParams.Metric];
const useCurrentAnalyticsPageContextMetrics = (): Array<TRAQIV2APIMetric> | null => {
  const [{ [AnalyticsQueryParams.Metric]: exploreModeQueryMetric }] = useQueryParams(metricParam);
  const contextResult = useRAQIV2ConfigurablePageSurfaceContextMetricsOrNull();

  const exploreModeResult = useMemo(() => {
    if (typeof exploreModeQueryMetric !== 'string') return null;
    if (isValidEnumValue(RAQIV2Metric, exploreModeQueryMetric)) {
      return [exploreModeQueryMetric];
    }
    if (isValidEnumValue(RAQIV2UIMetric, exploreModeQueryMetric)) {
      return [
        getAPIMetricFromUIMetric(exploreModeQueryMetric, {
          percentileType: null,
          aggregationType: null,
        }),
      ];
    }
    return null;
  }, [exploreModeQueryMetric]);

  const nonExploreModeResult = useMemo(() => {
    if (contextResult?.length) {
      return contextResult;
    }

    return null;
  }, [contextResult]);

  const result = nonExploreModeResult ?? exploreModeResult;
  return result;
};

export default useCurrentAnalyticsPageContextMetrics;
