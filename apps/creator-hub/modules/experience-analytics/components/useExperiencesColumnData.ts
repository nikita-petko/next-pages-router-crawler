import { ChartResourceType, useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic';
import { useQueries, UseQueryResult } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import {
  computeRAQIV2SpecOverride,
  FetchComparisonSeriesMode,
  makeRAQIV2Request,
  type RAQIV2QueryResponses,
  useRAQIV2Client,
  RAQIV2MetricGranularityToSeriesIntervalMeaning,
  type RAQIV2TableContext,
  TRAQIV2NumericUIMetric,
} from '@modules/experience-analytics-shared';
import {
  ExperiencesTableMetricKeyConfig,
  ExperiencesTableMetricKeys,
} from './experiencesTable/ExperiencesTableMetrics';

export type ExperienceRAQIV2ColumnData = Map<
  number,
  Array<{
    key: ExperiencesTableMetricKeys;
    spec: RAQIV2TableContext;
    data: RAQIV2QueryResponses;
    metric: TRAQIV2NumericUIMetric;
  }>
>;

const useExperiencesColumnData = ({
  universeIds,
  keys,
}: {
  universeIds: number[];
  keys: ExperiencesTableMetricKeys[];
}) => {
  const { client } = useRAQIV2Client(false);
  const { startDate, endDate } = useAnalyticsCurrentDateRangeBundle();

  const universeIdWithSpec = useMemo(() => {
    return universeIds.flatMap((universeId) =>
      keys.map((key) => {
        const { metric, overrides } = ExperiencesTableMetricKeyConfig[key];
        const tableContext: RAQIV2TableContext = {
          resource: {
            type: ChartResourceType.Universe,
            id: universeId,
          },
          timeSpec: {
            startTime: startDate,
            endTime: endDate,
          },
          granularity: RAQIV2MetricGranularity.OneDay,
        };

        return {
          key,
          spec: computeRAQIV2SpecOverride({ ...tableContext }, overrides ?? {}),
          metric,
        };
      }),
    );
  }, [endDate, keys, startDate, universeIds]);

  const combine = useCallback(
    (results: UseQueryResult<RAQIV2QueryResponses, Error>[]) => {
      const mappedData: ExperienceRAQIV2ColumnData = new Map();

      results.forEach(({ data }, idx) => {
        const { key, spec, metric } = universeIdWithSpec[idx];
        if (data) {
          const { id } = spec.resource;
          const columnData = mappedData.get(id) ?? [];
          columnData.push({
            key,
            spec,
            data,
            metric,
          });
          mappedData.set(id, columnData);
        }
      });

      return {
        data: mappedData,
        isPending: results.some((result) => result.isPending),
        isError: results.some((result) => result.isError),
      };
    },
    [universeIdWithSpec],
  );

  return useQueries({
    queries: universeIdWithSpec.map(({ spec, metric }) => {
      const {
        timeSpec: { startTime, endTime },
        resource,
        granularity,
        breakdown,
        filter,
      } = spec;
      return {
        queryKey: [
          'getExperienceMetric',
          metric,
          resource.id,
          startTime.getTime(),
          endTime.getTime(),
        ],
        queryFn: async () => {
          const queryRequest = {
            resource,
            metric,
            timeSpec: spec.timeSpec,
            granularity,
            breakdown,
            filter,
          };
          return makeRAQIV2Request(queryRequest, client, {
            fetchTotalSeries: true,
            fetchComparison: {
              mode: FetchComparisonSeriesMode.Combined,
              seriesIntervalMeaning: RAQIV2MetricGranularityToSeriesIntervalMeaning(
                spec.granularity,
              ),
            },
            allowComputedMetrics: false,
          });
        },
        enabled: resource.id !== uninitializedUniverseId,
      };
    }),
    combine,
  });
};

export default useExperiencesColumnData;
