import { useEffect, useState } from 'react';
import {
  LiveStatsMetric,
  type QueryResponse,
  type UniversePerformanceRaqiClient,
} from '@modules/clients/analytics/universePerformanceRaqi';
import { getCurrentDate } from '@modules/charts-generic';

type ResponseSummary = {
  total: number;
  computer: number;
  phone: number;
  tablet: number;
  console: number;
  vr: number;
};

type responseBreakdownType = 'Computer' | 'Console' | 'Phone' | 'Tablet' | 'VR';

const formatSummary = (response: QueryResponse): ResponseSummary | null => {
  const summary: ResponseSummary = {
    total: 0,
    computer: 0,
    phone: 0,
    tablet: 0,
    console: 0,
    vr: 0,
  };
  if (!response.values) {
    return null;
  }
  response.values.forEach((element) => {
    if (element.breakdowns && element.datapoints) {
      const breakdownType = element.breakdowns[0].value as responseBreakdownType;
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
        default:
          // NOTE(shumingxu, 08/16/2023): Don't do anything to ignore unhandled
          // platforms since we still want to show the other platforms.
          break;
      }
    }
  });
  summary.total = summary.computer + summary.console + summary.phone + summary.tablet + summary.vr;
  return summary;
};

const useLiveConcurrentPlayerStats = (
  universeId: number,
  universePerformanceRaqiClient: UniversePerformanceRaqiClient,
) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [summary, setSummary] = useState<ResponseSummary>();
  const [serverCount, setServerCount] = useState<number>(0);
  const [latestUpdateTime, setLatestUpdateTime] = useState<Date | null>(null);

  useEffect(() => {
    let isUnmounted = false;
    const getLiveStats = async (shouldReportError = false) => {
      if (universeId < 0) {
        return;
      }
      try {
        const liveStatsResponse = await universePerformanceRaqiClient.getLiveStatsByPlatform({
          universeId,
          metric: LiveStatsMetric.ConcurrentPlayers,
          filters: null,
        });
        const formattedSummary = formatSummary(liveStatsResponse);
        if (formattedSummary) {
          setSummary(formattedSummary);
        }

        const serverCountResponse = await universePerformanceRaqiClient.getLiveStatsTotal({
          universeId,
          metric: LiveStatsMetric.ActiveServers,
          filters: null,
        });

        let updatedServerCount = 0;
        if (
          serverCountResponse.values?.length &&
          serverCountResponse.values[0].datapoints?.length
        ) {
          updatedServerCount = serverCountResponse.values[0].datapoints[0].value ?? 0;
        }
        setServerCount(updatedServerCount);
        setHasError(false);
      } catch {
        if (!isUnmounted && shouldReportError) {
          setHasError(true);
        }
      } finally {
        setLatestUpdateTime(getCurrentDate());
      }
      setIsLoading(false);
    };
    getLiveStats(true);
    const pollLiveStatsInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        getLiveStats();
      }
    }, 1000 * 60);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        getLiveStats();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isUnmounted = true;
      clearInterval(pollLiveStatsInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [universeId, universePerformanceRaqiClient]);

  return { summary, serverCount, isLoading, hasError, latestUpdateTime };
};

export default useLiveConcurrentPlayerStats;
