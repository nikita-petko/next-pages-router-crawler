import { useCallback, useMemo } from 'react';
import {
  useFindHomepageThumbnailPersonalization,
  useGetHomepageThumbnailsQuery,
} from '@modules/react-query/thumbnailPersonalization';
import { useQueries, UseQueryResult } from '@tanstack/react-query';
import { ChartResourceType, ColumnType, getCurrentHourDate } from '@modules/charts-generic';
import { subDays } from '@rbx/core';
import { RAQIV2Dimension, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { getResponseFromError } from '@modules/clients/utils';
import { HttpStatusCodes } from '@modules/miscellaneous/common';
import RAQIV2TableContext from '../types/RAQIV2TableContext';
import {
  getColumnConfigByKey,
  isPersonalizedThumbnailsColumnKeyRAQIV2Compatible,
  TPersonalizedThumbnailsTableColumnKey,
} from '../constants/PersonalizedThumbnailsTableConfig';
import { isMetricTableColumnConfig } from '../constants/RAQIV2PredefinedTableColumnConfig';
import computeRAQIV2SpecOverride from '../utils/computeRAQIV2SpecOverride';
import RAQIV2TableColumnSpec from '../types/RAQIV2TableColumnSpec';
import { useRAQIV2Client } from '../context/RAQIV2ClientProvider';
import makeRAQIV2Request from '../utils/makeRAQIV2Request';
import genericRAQIV2TableAdapter from '../adapters/genericRAQIV2TableAdapter';
import useRAQIV2TranslationDependencies from './useRAQIV2TranslationDependencies';
import { RAQIV2QueryResponses } from '../utils/combineRAQIV2QueryResponses';
import { tableColumnConfigThumbnailWinningSegments } from '../constants/chart-configs/PredefinedTableColumnConfigLiterals';

const raqiQueryKeyPrefix = 'getPersonalizedThumbnailsRAQIData';

const getQueryKey = (spec: RAQIV2TableColumnSpec, universeId: number) => {
  const {
    metric,
    timeSpec: { startTime, endTime },
    filter,
  } = spec;
  return [
    raqiQueryKeyPrefix,
    universeId,
    metric,
    startTime.getDate(),
    startTime.getMonth(),
    endTime.getDate(),
    endTime.getMonth(),
    filter
      ? [...filter]
          .sort((a, b) => a.dimension.localeCompare(b.dimension))
          .flatMap((f) => [...f.values, f.dimension])
      : undefined,
  ];
};

const usePersonalizedThumbnailsRAQIV2RowData = (
  universeId: number,
  columnKeys: TPersonalizedThumbnailsTableColumnKey[],
) => {
  const { client } = useRAQIV2Client(false);
  const translationDependencies = useRAQIV2TranslationDependencies();

  const {
    data: thumbnailsData,
    isPending: isLoadingHomepageThumbnails,
    isError: isErrorHomepageThumbnails,
  } = useGetHomepageThumbnailsQuery(universeId);
  const {
    data: personalizationConfigData,
    isPending: isLoadingPersonalizationConfig,
    isError: isErrorPersonalizationConfig,
  } = useFindHomepageThumbnailPersonalization(universeId, true);

  const tableContext: RAQIV2TableContext = useMemo(() => {
    const endTime = getCurrentHourDate();
    return {
      resource: {
        type: ChartResourceType.Universe,
        id: universeId,
      },
      // startTime is 7 days before endTime.
      timeSpec: {
        startTime: subDays(endTime, 7),
        endTime,
      },
      granularity: RAQIV2MetricGranularity.None,
      filter: personalizationConfigData?.personalizedConfigs?.length
        ? [
            {
              dimension: RAQIV2Dimension.ThumbnailList,
              values: personalizationConfigData.personalizedConfigs.map((config) => config.id),
            },
          ]
        : undefined,
    };
  }, [universeId, personalizationConfigData]);

  const raqiColumnSpecs = useMemo(() => {
    const columnSpecs: (RAQIV2TableColumnSpec & {
      columnKey: TPersonalizedThumbnailsTableColumnKey;
    })[] = [];
    columnKeys.forEach((columnKey) => {
      if (isPersonalizedThumbnailsColumnKeyRAQIV2Compatible(columnKey)) {
        const config = getColumnConfigByKey(columnKey);
        if (isMetricTableColumnConfig(config)) {
          const { metric, overrides } = config;
          const dataColumnSpec = {
            columnKey,
            ...computeRAQIV2SpecOverride({ ...tableContext, metric }, overrides ?? {}),
          };
          columnSpecs.push(dataColumnSpec);
        }
      }
    });
    return columnSpecs;
  }, [columnKeys, tableContext]);

  const combine = useCallback(
    (results: UseQueryResult<RAQIV2QueryResponses, Error>[]) => {
      const isLoading =
        isLoadingHomepageThumbnails ||
        isLoadingPersonalizationConfig ||
        results.some((result) => result.isPending);
      const isError =
        isErrorHomepageThumbnails ||
        isErrorPersonalizationConfig ||
        results.some((result) => result.isError);
      const isForbidden =
        isError &&
        results.some((result) => {
          const resErr = getResponseFromError(result.error);
          return resErr && resErr.status === HttpStatusCodes.FORBIDDEN;
        });

      const status = {
        isDataLoading: isLoading,
        isResponseFailed: isError,
        isUserForbidden: isForbidden,
      };

      if (status.isDataLoading || status.isResponseFailed || status.isUserForbidden) {
        return {
          rowData: [],
          ...status,
        };
      }

      const requiredBreakdownRows = thumbnailsData?.thumbnails.map((thumbnail) => [
        {
          dimension: RAQIV2Dimension.ThumbnailAsset,
          value: thumbnail.assetId.toString(),
        },
      ]);

      const rows = genericRAQIV2TableAdapter({
        data: new Map(
          results.map((result, index) => {
            const spec = raqiColumnSpecs[index];
            return [spec.columnKey, result.data ?? null];
          }),
        ),
        specs: new Map(raqiColumnSpecs.map((spec) => [spec.columnKey, spec])),
        translationDependencies,
        dimensionColumnKeys: [RAQIV2Dimension.ThumbnailAsset],
        requiredBreakdownRows,
      });

      if (rows.length) {
        // The first row is the 'Total' row, which represents data without any breakdowns.
        // By default, the adapter puts the 'Total' row at the top using the order in 'requiredBreakdownRows'.
        const totalRow = rows[0];

        // The remaining rows represent individual thumbnails and are initially sorted by thumbnail asset id.
        // We want to reorder these rows to match the order they appear in 'requiredBreakdownRows'.
        const restRows = rows.slice(1);
        restRows.sort((rowA, rowB) => {
          const assetA = rowA.get(RAQIV2Dimension.ThumbnailAsset);
          const assetB = rowB.get(RAQIV2Dimension.ThumbnailAsset);
          if (assetA?.type !== ColumnType.Text || assetB?.type !== ColumnType.Text) {
            return 0;
          }
          return (
            (requiredBreakdownRows?.findIndex((row) => row[0].value === assetA.value) ?? -1) -
            (requiredBreakdownRows?.findIndex((row) => row[0].value === assetB.value) ?? -1)
          );
        });

        return {
          rowData: [
            {
              isTotalRow: true,
              // For the 'Total' row, the winning segments column may sometimes be a list of strings
              // even when there are no breakdowns. In that case, we show 'N/A' instead of the list.
              cellData: totalRow.set(tableColumnConfigThumbnailWinningSegments.key, {
                type: ColumnType.Text,
                value: 'N/A',
              }),
            },
            ...restRows.map((row) => ({
              isTotalRow: false,
              cellData: row,
            })),
          ],
          ...status,
        };
      }

      return {
        rowData: [],
        ...status,
      };
    },
    [
      isErrorHomepageThumbnails,
      isErrorPersonalizationConfig,
      isLoadingHomepageThumbnails,
      isLoadingPersonalizationConfig,
      raqiColumnSpecs,
      thumbnailsData?.thumbnails,
      translationDependencies,
    ],
  );

  const results = useQueries({
    queries: raqiColumnSpecs.map(({ columnKey: omit, ...spec }) => {
      const { filter } = spec;
      return {
        queryKey: getQueryKey(spec, universeId),
        queryFn: async () =>
          makeRAQIV2Request(spec, client, {
            fetchTotalSeries: true,
            allowComputedMetrics: false,
          }),
        // thumbnail queries require thumbnail list id (aka. personalized configuartion id) as filter
        // if no filter is available (in the event of loading personalized configuartion), the query will not be enabled
        enabled: filter && filter.length > 0,
      };
    }),
    combine,
  });

  const createdTimeUTC = useMemo(() => {
    const createdUtc = personalizationConfigData?.personalizedConfigs?.[0]?.createdUtc;

    return createdUtc ? new Date(createdUtc) : undefined;
  }, [personalizationConfigData?.personalizedConfigs]);

  const startTimeUTC = useMemo(() => {
    return !createdTimeUTC || createdTimeUTC < tableContext.timeSpec.startTime
      ? tableContext.timeSpec.startTime
      : createdTimeUTC;
  }, [createdTimeUTC, tableContext.timeSpec.startTime]);

  return useMemo(
    () => ({
      ...results,
      startTimeUTC,
      endTimeUTC: tableContext.timeSpec.endTime,
      createdTimeUTC,
    }),
    [results, startTimeUTC, tableContext.timeSpec.endTime, createdTimeUTC],
  );
};

export default usePersonalizedThumbnailsRAQIV2RowData;
