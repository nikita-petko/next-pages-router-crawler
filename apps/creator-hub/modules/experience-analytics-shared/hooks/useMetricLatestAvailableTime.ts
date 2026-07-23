import { useQuery } from '@tanstack/react-query';
import { TRAQIV2APIMetric } from '@rbx/creator-hub-analytics-config';
import { RAQIV2MetricMetadataResult } from '@modules/clients/analytics';
import { useCallback, useMemo } from 'react';
import { useRAQIV2Client } from '../context/RAQIV2ClientProvider';
import { determineLatestAvailableTime, fetchMetricMetadata } from '../utils/makeRAQIV2Request';

const useMetricLatestAvailableTime = (
  input: TRAQIV2APIMetric | TRAQIV2APIMetric[],
  disableMaxEndDateByLatestAvailableTime?: boolean,
) => {
  const { client } = useRAQIV2Client(false);
  const finalMetrics = useMemo(() => {
    const metrics = Array.isArray(input) ? input : [input];
    return Array.from(new Set(metrics)).sort();
  }, [input]);

  const select = useCallback((metricMetadata: RAQIV2MetricMetadataResult | null) => {
    return determineLatestAvailableTime(metricMetadata);
  }, []);

  return useQuery({
    queryKey: ['metrics-latest-available-time', finalMetrics],
    queryFn: async () => fetchMetricMetadata(client, { metrics: finalMetrics }),
    select,
    enabled: finalMetrics.length > 0 && !disableMaxEndDateByLatestAvailableTime,
  });
};

export default useMetricLatestAvailableTime;
