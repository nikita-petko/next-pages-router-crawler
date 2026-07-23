import { useCallback, useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQueries } from '@tanstack/react-query';
import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import type { TRAQIV2NumericUIMetric } from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import { useRAQIV2Client } from '@modules/experience-analytics-shared/context/RAQIV2ClientProvider';
import useRAQIV2RequestFlags from '@modules/experience-analytics-shared/hooks/useRAQIV2RequestFlags';
import type RAQIV2TableContext from '@modules/experience-analytics-shared/types/RAQIV2TableContext';
import type { RAQIV2QueryResponses } from '@modules/experience-analytics-shared/utils/combineRAQIV2QueryResponses';
import computeRAQIV2SpecOverride from '@modules/experience-analytics-shared/utils/computeRAQIV2SpecOverride';
import makeRAQIV2Request, {
  FetchComparisonSeriesMode,
} from '@modules/experience-analytics-shared/utils/makeRAQIV2Request';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import type { ExperiencesTableMetricKeys } from './experiencesTable/ExperiencesTableMetrics';
import { ExperiencesTableMetricKeyConfig } from './experiencesTable/ExperiencesTableMetrics';

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
  const { ready: requestFlagsReady, enableComparisonRangePolicy } = useRAQIV2RequestFlags();
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
            rangeType: RAQIV2DateRangeType.Custom,
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
    (results: UseQueryResult<RAQIV2QueryResponses>[]) => {
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
          enableComparisonRangePolicy,
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
            enableComparisonRangePolicy,
            fetchTotalSeries: true,
            fetchComparison: {
              mode: FetchComparisonSeriesMode.Combined,
              granularity: spec.granularity,
            },
          });
        },
        enabled: requestFlagsReady && resource.id !== uninitializedUniverseId,
      };
    }),
    combine,
  });
};

export default useExperiencesColumnData;
