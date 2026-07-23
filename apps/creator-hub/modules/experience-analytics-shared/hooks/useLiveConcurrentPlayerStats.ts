import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LiveStatsMetric,
  type QueryResponse,
  type UniversePerformanceRaqiClient,
} from '@modules/clients/analytics/universePerformanceRaqi';

type ResponseSummary = {
  total: number;
  computer: number;
  phone: number;
  tablet: number;
  console: number;
  vr: number;
  tv: number;
};

const formatSummary = (response: QueryResponse): ResponseSummary | null => {
  const summary: ResponseSummary = {
    total: 0,
    computer: 0,
    phone: 0,
    tablet: 0,
    console: 0,
    vr: 0,
    tv: 0,
  };
  if (!response.values) {
    return null;
  }
  response.values.forEach((element) => {
    if (element.breakdowns && element.datapoints) {
      const breakdownType = element.breakdowns[0].value;
      const breakdownValue = Math.round(element.datapoints[0].value ?? 0);
      switch (breakdownType) {
        case 'Computer':
          summary.computer = breakdownValue;
          break;
        case 'Console':
          summary.console = breakdownValue;
          break;
        case 'Phone':
          summary.phone = breakdownValue;
          break;
        case 'Tablet':
          summary.tablet = breakdownValue;
          break;
        case 'VR':
          summary.vr = breakdownValue;
          break;
        case 'TV':
          summary.tv = breakdownValue;
          break;
        case undefined:
        default:
          break;
      }
    }
  });
  summary.total =
    summary.computer + summary.console + summary.phone + summary.tablet + summary.vr + summary.tv;
  return summary;
};

const POLL_INTERVAL = 60_000;

const useLiveConcurrentPlayerStats = (
  universeId: number,
  universePerformanceRaqiClient: UniversePerformanceRaqiClient,
) => {
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    dataUpdatedAt: summaryUpdatedAt,
  } = useQuery({
    queryKey: ['liveStatsByPlatform', universeId],
    queryFn: async () => {
      const response = await universePerformanceRaqiClient.getLiveStatsByPlatform({
        universeId,
        metric: LiveStatsMetric.ConcurrentPlayers,
        filters: null,
      });
      return formatSummary(response);
    },
    enabled: universeId >= 0,
    refetchInterval: POLL_INTERVAL,
  });

  const {
    data: serverCount,
    isLoading: isServerCountLoading,
    isError: isServerCountError,
  } = useQuery({
    queryKey: ['liveStatsServerCount', universeId],
    queryFn: async () => {
      const response = await universePerformanceRaqiClient.getLiveStatsTotal({
        universeId,
        metric: LiveStatsMetric.ActiveServers,
        filters: null,
      });
      if (response.values?.length && response.values[0].datapoints?.length) {
        return response.values[0].datapoints[0].value ?? 0;
      }
      return 0;
    },
    enabled: universeId >= 0,
    refetchInterval: POLL_INTERVAL,
  });

  const latestUpdateTime = useMemo(
    () => (summaryUpdatedAt ? new Date(summaryUpdatedAt) : null),
    [summaryUpdatedAt],
  );

  return {
    summary: summary ?? undefined,
    serverCount: serverCount ?? 0,
    isLoading: isSummaryLoading || isServerCountLoading,
    hasError: isSummaryError || isServerCountError,
    latestUpdateTime,
  };
};

export default useLiveConcurrentPlayerStats;
