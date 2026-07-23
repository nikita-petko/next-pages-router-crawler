import { keepPreviousData, useQueries, UseQueryResult } from '@tanstack/react-query';
import {
  validateRAQIV2Request,
  makeRAQIV2Request,
  RAQIV2QueryResponses,
  RAQIV2UIQueryRequest,
  useRAQIV2Client,
  RAQIV2TableContext,
} from '@modules/experience-analytics-shared';
import { useCallback, useMemo } from 'react';
import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { CellDataType, GenericChartState } from '@modules/charts-generic';
import { getResponseFromError } from '@modules/clients/utils';
import { StatusCodes } from '@rbx/core';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
// Note: I'm importing these to avoid duping the same files but they should probably be put in a shared analytics lib if these
// are going to be used more than once
import { CohortTimeInterval } from '../RetentionPage/useRetentionCohortPagination';
import { SpecialCohortColumnKey } from './cohortTableConfigs';
import { ColumnDataPoints } from '../RetentionPage/useCombineRowDataCallbacks';
import { getDynamicCohortColumnKey } from '../RetentionPage/configs';

export const CohortTimeIntervalToRAQIV2Metric: Record<
  CohortTimeInterval,
  { metric: RAQIV2Metric; breakdownDimension: RAQIV2Dimension }
> = {
  [RAQIV2MetricGranularity.OneWeek]: {
    metric: RAQIV2Metric.WeeklyCohortRetention,
    breakdownDimension: RAQIV2Dimension.CohortWeek,
  },
  [RAQIV2MetricGranularity.OneDay]: {
    metric: RAQIV2Metric.DailyCohortRetention,
    breakdownDimension: RAQIV2Dimension.CohortDay,
  },
};

type RowData<ColumnKey extends string> = {
  state: GenericChartState;
  rowData: Map<ColumnKey, CellDataType>[];
};

const useAudienceExpansionFunnelRowData = <ColumnKey extends string>({
  tableContext,
  cohortTimeInterval,
  combineToRowData,
  orderedColumnKeys,
  ignoreCache = false,
}: {
  tableContext: RAQIV2TableContext;
  orderedColumnKeys: readonly ColumnKey[];
  cohortTimeInterval: CohortTimeInterval;
  combineToRowData: (results: ColumnDataPoints<ColumnKey>) => Map<ColumnKey, CellDataType>[];
  ignoreCache?: boolean;
}): RowData<ColumnKey> => {
  const { client } = useRAQIV2Client(ignoreCache);

  const raqiSpecs: Array<RAQIV2UIQueryRequest & { columnKey: ColumnKey }> = useMemo(() => {
    const specs: Array<RAQIV2UIQueryRequest & { columnKey: ColumnKey }> = [];
    orderedColumnKeys.forEach((columnKey) => {
      if (columnKey === SpecialCohortColumnKey.Cohort) {
        /* Not a raqi column, skip it */
      } else if (columnKey === SpecialCohortColumnKey.CohortInterval) {
        const { metric, breakdownDimension } = CohortTimeIntervalToRAQIV2Metric[cohortTimeInterval];
        specs.push({
          ...tableContext,
          columnKey,
          metric,
          breakdown: [breakdownDimension],
          granularity: tableContext.granularity,
        });
      } else if (isValidEnumValue(RAQIV2Metric, columnKey)) {
        specs.push({
          ...tableContext,
          columnKey,
          metric: columnKey,
          granularity: tableContext.granularity,
        });
      }
    });
    return specs;
  }, [cohortTimeInterval, orderedColumnKeys, tableContext]);

  const combine = useCallback(
    (results: UseQueryResult<RAQIV2QueryResponses, Error>[]) => {
      const isDataLoading = results.some((result) => result.isPending);
      const isResponseFailed = results.some((result) => result.isError);
      const isUserForbidden =
        isResponseFailed &&
        results.some(({ error }) => getResponseFromError(error)?.status === StatusCodes.FORBIDDEN);

      const columnDataPoints: ColumnDataPoints<ColumnKey> = [];
      results.forEach((result, idx) => {
        const { columnKey } = raqiSpecs[idx];
        if (columnKey === SpecialCohortColumnKey.CohortInterval) {
          result.data?.response?.values?.forEach(({ breakdownValue, dataPoints }) => {
            if (!breakdownValue?.length) return;
            const { dimension, value } = breakdownValue[0];
            if (!dimension || !value) return;
            const dynamicColumnKey = getDynamicCohortColumnKey<ColumnKey>(
              Number.parseInt(value, 10),
            );
            columnDataPoints.push({
              columnKey: dynamicColumnKey,
              dataPoints: dataPoints ?? [],
            });
          });
        } else {
          columnDataPoints.push({
            columnKey,
            dataPoints: result.data?.response?.values?.[0]?.dataPoints ?? [],
          });
        }
      });

      return {
        state: {
          error: results.find((result) => result.isError)?.error,
          isDataLoading,
          isResponseFailed,
          isUserForbidden,
        },
        rowData: combineToRowData(columnDataPoints),
      };
    },
    [combineToRowData, raqiSpecs],
  );

  return useQueries({
    queries: raqiSpecs.map(({ columnKey, ...spec }) => {
      return {
        granularity: spec.granularity,
        queryKey: [columnKey, spec],
        queryFn: () => {
          const validationError = validateRAQIV2Request(spec);
          if (validationError.length > 0) {
            throw validationError[0];
          }
          return makeRAQIV2Request(spec, client, {
            allowComputedMetrics: false,
          });
        },
        enabled: !spec.resource.isLoading,
        keepPreviousData,
      };
    }),
    combine,
  });
};

export default useAudienceExpansionFunnelRowData;
