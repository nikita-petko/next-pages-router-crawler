import { useQuery } from '@tanstack/react-query';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import type { RAQIV2QueryFilter } from '@modules/clients/analytics';
import { useRAQIV2Client } from '@modules/experience-analytics-shared/context/RAQIV2ClientProvider';
import { useUniverseIdDeprecatedFromAnalytics as useUniverseId } from '@modules/experience-analytics-shared/context/useUniverseID';
import makeRAQIV2Request from '@modules/experience-analytics-shared/utils/makeRAQIV2Request';
import { adaptJourneyAPIResponse } from './adapters/journeyTransitionAdapter';
import type { JourneyData, SankeyLink, SankeyNode } from './types';

export function useJourneyTransitions(
  journeyName: string,
  journeyVersion: string | null,
  raqiFilters: RAQIV2QueryFilter[],
): {
  isLoading: boolean;
  error: unknown;
  sankeyData: { nodes: SankeyNode[]; links: SankeyLink[] } | undefined;
  journeyData: JourneyData | undefined;
  refetch: () => void;
} {
  const { client } = useRAQIV2Client(false);
  const universeId = useUniverseId();
  const { startDate, endDate } = useAnalyticsCurrentDateRangeBundle();

  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [
      'journey-transitions',
      universeId,
      journeyName,
      journeyVersion,
      startDate.getTime(),
      endDate.getTime(),
      raqiFilters.map((f) => `${f.dimension}:${f.values.join(',')}`),
    ] as const,
    queryFn: async () => {
      const resource = { type: ChartResourceType.Universe, id: universeId } as const;
      const timeSpec = {
        rangeType: RAQIV2DateRangeType.Custom,
        startTime: startDate,
        endTime: endDate,
      };
      const granularity = RAQIV2MetricGranularity.None;
      const breakdown = [
        RAQIV2Dimension.FromNode,
        RAQIV2Dimension.ToNode,
        RAQIV2Dimension.FromStage,
        RAQIV2Dimension.ToStage,
      ];
      const versionFilter = journeyVersion
        ? [{ dimension: RAQIV2Dimension.JourneyVersion, values: [journeyVersion] }]
        : [];
      const filter = [
        { dimension: RAQIV2Dimension.JourneyName, values: [journeyName] },
        ...versionFilter,
        ...raqiFilters,
      ];

      const [countUserResult, countTransitionResult] = await Promise.all([
        makeRAQIV2Request(
          {
            resource,
            granularity,
            timeSpec,
            breakdown,
            filter,
            metric: RAQIV2Metric.JourneyTransitionCountUser,
          },
          client,
        ),
        makeRAQIV2Request(
          {
            resource,
            granularity,
            timeSpec,
            breakdown,
            filter,
            metric: RAQIV2Metric.JourneyTransitionCount,
          },
          client,
        ),
      ]);

      return adaptJourneyAPIResponse(countUserResult.response, countTransitionResult.response);
    },
    enabled: Number.isFinite(universeId) && universeId > 0 && Boolean(journeyName),
  });

  return {
    isLoading,
    error,
    sankeyData: data?.sankeyData,
    journeyData: data?.journeyData,
    refetch,
  };
}
