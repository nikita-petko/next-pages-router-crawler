import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
  RAQIV2ProductType,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { NumberIcon } from '@modules/charts-generic/charts/numberFormatters';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import type { RAQIV2TableRowID } from '@modules/experience-analytics-shared/adapters/genericRAQIV2TableAdapter';
import type {
  PaginatedColumnRequest,
  RowDataResponse,
} from '@modules/experience-analytics-shared/components/RAQIV2/table/GenericDataTable';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import type { AnalyticsSummaryCardConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedSummaryCardConfig';
import type {
  TAnalyticsCustomTableColumnConfig,
  TAnalyticsMetricTableColumnConfig,
} from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableColumnConfig';
import type { TAnalyticsNonSerializableTableConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableConfig';
import RAQIV2SummaryCardType from '@modules/experience-analytics-shared/constants/RAQIV2SummaryCardType';
import { RAQIV2SummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import type { PaginationResponse } from '@modules/experience-analytics-shared/hooks/usePaginatedRequest';
import {
  CreatorAnalyticsPageMode,
  type AnalyticsPageConfigAnnotationOptions,
  type AnalyticsPageConfigDateOptions,
  type CreatorAnalyticsEmbeddedSurfaceConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import type { ItemMetadata } from '@modules/experience-analytics-shared/types/RAQIV2SummaryCardShared';
import type { TabbedChartConfig } from '@modules/experience-analytics-shared/types/RAQIV2TabbedChartConfig';
import type { Item } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ItemMonetizationApiClient } from '../context/ItemMonetizationClientProvider';
import buildGamePassBonusPromotionsTableConfig from '../pages/GamePasses/BonusPromotions/buildGamePassBonusPromotionsTableConfig';
import type { ParsedProductKey } from './parseProductKeyBreakdownValue';
import parseProductKeyBreakdownValue from './parseProductKeyBreakdownValue';

const keyToString = (key: ParsedProductKey): string => `${key.subtype ?? ''}_${key.itemId}`;

export interface ItemMonetizationContentConfig {
  productType: RAQIV2ProductType;
  getItemType: (breakdowns: RAQIV2BreakdownValue[]) => Item;
  tableKeysPrefix: string;
  topItemsHeadingKey: TranslationKey;
  nameColumnTitleKey: TranslationKey;
  revenueTitleKey: TranslationKey;
  salesTitleKey: TranslationKey;

  makeGetItemMetadataForSummaryCard: (
    universeId: number,
  ) => (breakdowns: RAQIV2BreakdownValue[]) => Promise<ItemMetadata>;

  getItemsByIds: (
    universeId: number,
    keys: ParsedProductKey[],
    client: ItemMonetizationApiClient,
  ) => Promise<Array<{ id: number; name: string; priceInRobux: number }>>;

  getThumbnailUrl: (key: ParsedProductKey) => Promise<string>;

  getConfigureUrl: (universeId: number, key: ParsedProductKey) => string | undefined;
}

const buildGetNameData = (
  universeId: number,
  client: ItemMonetizationApiClient,
  content: ItemMonetizationContentConfig,
) => {
  return async (
    request: PaginatedColumnRequest<RAQIV2BreakdownValue[], RAQIV2TableRowID, string>,
  ): Promise<PaginationResponse<RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>>> => {
    const { rows } = request;
    if (!rows.length) {
      return { values: [], total: 0, nextPaginationToken: '' };
    }

    const parsedKeys = rows
      .map(({ data }) => parseProductKeyBreakdownValue(data))
      .filter((k): k is ParsedProductKey => k !== undefined);

    try {
      const items = await content.getItemsByIds(universeId, parsedKeys, client);
      const idToName = new Map<number, string>();
      items.forEach((p) => {
        idToName.set(p.id, p.name);
      });

      const thumbnailResults = await Promise.all(
        parsedKeys.map(async (key) => {
          const imageUrl = await content.getThumbnailUrl(key);
          return { k: keyToString(key), imageUrl };
        }),
      );
      const keyStringToImageUrl = new Map<string, string>();
      thumbnailResults.forEach(({ k, imageUrl }) => {
        keyStringToImageUrl.set(k, imageUrl);
      });

      const values: RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>[] = rows.map(
        ({ id, data }) => {
          const parsed = parseProductKeyBreakdownValue(data);
          const itemId = parsed?.itemId;
          const name = itemId !== undefined ? (idToName.get(itemId) ?? '') : '';
          const imageUrl = parsed ? (keyStringToImageUrl.get(keyToString(parsed)) ?? '') : '';
          const link = parsed ? content.getConfigureUrl(universeId, parsed) : undefined;

          return {
            rowId: id,
            data: {
              type: ColumnType.Image,
              src: imageUrl,
              text: name,
              link,
              width: 40,
            },
            rowData: data,
          };
        },
      );
      return { values, total: values.length, nextPaginationToken: '' };
    } catch {
      logAnalyticsError('item monetization get meta data');
      const values: RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>[] = rows.map(
        ({ id, data }) => ({
          rowId: id,
          data: {
            type: ColumnType.Image,
            src: '',
            width: 40,
          },
          rowData: data,
        }),
      );
      return { values, total: values.length, nextPaginationToken: '' };
    }
  };
};

const buildGetCurrentPriceData = (
  universeId: number,
  client: ItemMonetizationApiClient,
  content: ItemMonetizationContentConfig,
) => {
  return async (
    request: PaginatedColumnRequest<RAQIV2BreakdownValue[], RAQIV2TableRowID, string>,
  ): Promise<PaginationResponse<RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>>> => {
    const { rows } = request;
    if (!rows.length) {
      return { values: [], total: 0, nextPaginationToken: '' };
    }

    const parsedKeys = rows
      .map(({ data }) => parseProductKeyBreakdownValue(data))
      .filter((k): k is ParsedProductKey => k !== undefined);

    try {
      const items = await content.getItemsByIds(universeId, parsedKeys, client);
      const idToPrice = new Map<number, number>();
      items.forEach((p) => {
        idToPrice.set(p.id, p.priceInRobux ?? 0);
      });
      const values: RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>[] = rows.map(
        ({ id, data }) => {
          const parsed = parseProductKeyBreakdownValue(data);
          const itemId = parsed?.itemId ?? 0;
          return {
            rowId: id,
            data: { type: ColumnType.Number, value: idToPrice.get(itemId) ?? 0 },
            rowData: data,
          };
        },
      );
      return { values, total: values.length, nextPaginationToken: '' };
    } catch {
      logAnalyticsError('item monetization get price data');
      const values: RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>[] = rows.map(
        ({ id, data }) => ({
          rowId: id,
          data: { type: ColumnType.Number, value: 0 },
          rowData: data,
        }),
      );
      return { values, total: values.length, nextPaginationToken: '' };
    }
  };
};

export const buildItemMonetizationPageConfig = (
  universeId: number | undefined,
  client: ItemMonetizationApiClient,
  transactionPageUrl: string,
  content: ItemMonetizationContentConfig,
  maxStartDateOffsetDays = 365,
): CreatorAnalyticsEmbeddedSurfaceConfig => {
  const getOverviewColumn = (universeIdParam: number, clientParam: ItemMonetizationApiClient) =>
    ({
      key: `${content.tableKeysPrefix}NameColumn`,
      titleKey: content.nameColumnTitleKey,
      columnType: ColumnType.Image,
      getData: buildGetNameData(universeIdParam, clientParam, content),
    }) as const satisfies TAnalyticsCustomTableColumnConfig;

  const getCurrentPriceColumn = (universeIdParam: number, clientParam: ItemMonetizationApiClient) =>
    ({
      key: `${content.tableKeysPrefix}DataColumn`,
      titleKey: translationKey('Label.CurrentPrice', TranslationNamespace.Analytics),
      columnType: ColumnType.Number,
      analyticsNumberFormattingSpec: {
        icon: NumberIcon.Robux,
        numberFormatOptions: {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        },
        abbreviate: false,
      },
      getData: buildGetCurrentPriceData(universeIdParam, clientParam, content),
    }) as const satisfies TAnalyticsCustomTableColumnConfig;

  const salesColumn = {
    key: `${content.tableKeysPrefix}${RAQIV2Metric.ItemMonetizationSales}`,
    metric: RAQIV2Metric.ItemMonetizationSales,
    overrides: {
      granularity: { override: RAQIV2MetricGranularity.None },
      breakdown: {
        override: [RAQIV2Dimension.ProductKey],
      },
      filter: {
        override: [
          {
            dimension: RAQIV2Dimension.ProductType,
            values: [content.productType],
          },
        ],
      },
      limit: {
        override: 500,
      },
    },
    isComparisonDataShown: true,
    sort: {
      isFixedOrder: true,
      isServerSideSorting: true,
    },
  } as const satisfies TAnalyticsMetricTableColumnConfig;

  const revenueColumn = {
    key: `${content.tableKeysPrefix}${RAQIV2Metric.ItemMonetizationRevenue}`,
    metric: RAQIV2Metric.ItemMonetizationRevenue,
    overrides: {
      granularity: { override: RAQIV2MetricGranularity.None },
      breakdown: {
        override: [RAQIV2Dimension.ProductKey],
      },
      filter: {
        override: [
          {
            dimension: RAQIV2Dimension.ProductType,
            values: [content.productType],
          },
        ],
      },
      limit: {
        override: 500,
      },
    },
    isComparisonDataShown: true,
    sort: {
      isFixedOrder: true,
      isServerSideSorting: true,
    },
  } as const satisfies TAnalyticsMetricTableColumnConfig;

  const revenueChartConfig: ChartConfig = {
    type: AnalyticsComponentType.Chart,
    chartType: ChartType.Spline,
    titleKey: content.revenueTitleKey,
    metric: RAQIV2Metric.ItemMonetizationRevenue,
    overrides: {
      breakdown: {
        override: [RAQIV2UIPseudoDimension.TopProductKeyForRevenue],
      },
      filter: {
        override: [
          {
            dimension: RAQIV2Dimension.ProductType,
            values: [content.productType],
          },
        ],
      },
    },
  } as const satisfies ChartConfig;

  const salesChartConfig: ChartConfig = {
    type: AnalyticsComponentType.Chart,
    chartType: ChartType.Spline,
    titleKey: content.salesTitleKey,
    metric: RAQIV2Metric.ItemMonetizationSales,
    overrides: {
      breakdown: {
        override: [RAQIV2UIPseudoDimension.TopProductKeyForSales],
      },
      filter: {
        override: [
          {
            dimension: RAQIV2Dimension.ProductType,
            values: [content.productType],
          },
        ],
      },
    },
  } as const satisfies ChartConfig;

  const tabbedChartConfig: TabbedChartConfig = {
    type: AnalyticsComponentType.TabbedChart,
    titleKey: content.topItemsHeadingKey,
    tabs: [
      {
        chart: revenueChartConfig,
        tabLabel: content.revenueTitleKey,
      },
      {
        chart: salesChartConfig,
        tabLabel: content.salesTitleKey,
      },
    ],
  } as const satisfies TabbedChartConfig;

  const topSellingSummaryCard = (universeIdForUrl: number) =>
    ({
      type: AnalyticsComponentType.SummaryCard,
      cardType: RAQIV2SummaryCardType.Item,
      metric: RAQIV2Metric.ItemMonetizationSales,
      summaryType: { type: RAQIV2SummaryType.Total },
      overrides: {
        breakdown: { override: [RAQIV2Dimension.ProductKey] },
        limit: { override: 1 },
        granularity: { override: RAQIV2MetricGranularity.None },
        filter: {
          override: [{ dimension: RAQIV2Dimension.ProductType, values: [content.productType] }],
        },
      },
      getItemMetadata: content.makeGetItemMetadataForSummaryCard(universeIdForUrl),
      label: {
        key: translationKey('Label.TopSellingItem', TranslationNamespace.AvatarAnalytics),
        type: 'simple',
      },
    }) as const satisfies AnalyticsSummaryCardConfig;

  const topGrossingSummaryCard = (universeIdForUrl: number) =>
    ({
      type: AnalyticsComponentType.SummaryCard,
      cardType: RAQIV2SummaryCardType.Item,
      metric: RAQIV2Metric.ItemMonetizationRevenue,
      summaryType: { type: RAQIV2SummaryType.Total },
      overrides: {
        breakdown: { override: [RAQIV2Dimension.ProductKey] },
        limit: { override: 1 },
        granularity: { override: RAQIV2MetricGranularity.None },
        filter: {
          override: [{ dimension: RAQIV2Dimension.ProductType, values: [content.productType] }],
        },
      },
      getItemMetadata: content.makeGetItemMetadataForSummaryCard(universeIdForUrl),
      label: {
        key: translationKey('Label.TopGrossingItem', TranslationNamespace.AvatarAnalytics),
        type: 'simple',
      },
    }) as const satisfies AnalyticsSummaryCardConfig;

  return {
    mode: CreatorAnalyticsPageMode.Embedded,
    resourceTypes: [RAQIV2ChartResourceType.Universe],
    timeRangeOptions: {
      type: 'dateRange',
      supportedRanges: [
        RAQIV2DateRangeType.Last7Days,
        RAQIV2DateRangeType.Last28Days,
        RAQIV2DateRangeType.Last56Days,
        RAQIV2DateRangeType.Last90Days,
        RAQIV2DateRangeType.Custom,
      ],
      defaultRange: RAQIV2DateRangeType.Last28Days,
      excludeEndDateInRange: false,
      maxEndDateOffset: 0,
      maxStartDateOffsetDays,
    } as const satisfies AnalyticsPageConfigDateOptions,
    surfaceAnnotationOptions: {
      supportedAnnotationTypes: [
        AnnotationType.PlaceIcon,
        AnnotationType.PlaceThumbnail,
        AnnotationType.PlaceVideo,
        AnnotationType.PlaceVersion,
        AnnotationType.LiveEvent,
        AnnotationType.ConfigVersion,
        AnnotationType.Announcement,
      ],
      defaultAnnotationTypes: [],
      showAnnotationsControl: true,
    } as const satisfies AnalyticsPageConfigAnnotationOptions,
    granularity: {
      fixed: RAQIV2MetricGranularity.OneDay,
    },
    filterDimensions: [],
    breakdownDimensions: [],
    body: !universeId
      ? []
      : [
          {
            type: RAQIV2SpecialLayoutType.RowLayout,
            items: [topSellingSummaryCard(universeId), topGrossingSummaryCard(universeId)],
          },
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [tabbedChartConfig],
          },
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [
              {
                type: AnalyticsComponentType.Table,
                titleKey: content.topItemsHeadingKey,
                exportButtonConfig: {
                  link: transactionPageUrl,
                  definitionTooltipKey: translationKey(
                    'Description.ExportFromTransactionPage',
                    TranslationNamespace.Analytics,
                  ),
                },
                tableConfig: {
                  stickyHeader: true,
                  stickyFirstColumn: true,
                  columnDivider: false,
                  defaultActiveSort: `${content.tableKeysPrefix}${RAQIV2Metric.ItemMonetizationRevenue}`,
                },
                breakdowns: [RAQIV2Dimension.ProductKey],
                hideBreakdownLabelColumns: true,
                pagination: { pageSizeOptions: [5, 10, 20, 50], initialPageSize: 10 },
                dataColumns: [
                  getOverviewColumn(universeId, client),
                  getCurrentPriceColumn(universeId, client),
                  salesColumn,
                  revenueColumn,
                ],
              } as const satisfies TAnalyticsNonSerializableTableConfig,
              ...(content.productType === RAQIV2ProductType.GamePass
                ? [buildGamePassBonusPromotionsTableConfig(universeId, client, getOverviewColumn)]
                : []),
            ],
          },
        ],
  };
};
