import {
  DateRangeType,
  ColumnType,
  logAnalyticsError,
  ChartType,
  AnalyticsQueryParams,
} from '@modules/charts-generic';
import {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsEmbeddedSurfaceConfig,
  CreatorAnalyticsPageMode,
  AnalyticsComponentType,
  RAQIV2SpecialLayoutType,
  AnalyticsSummaryCardConfig,
  RAQIV2SummaryCardType,
  RAQIV2SummaryType,
  PaginatedColumnRequest,
  RowDataResponse,
  RAQIV2TableRowID,
  PaginationResponse,
  TAnalyticsCustomTableColumnConfig,
  TAnalyticsMetricTableColumnConfig,
  TAnalyticsNonSerializableTableConfig,
  TabbedChartConfig,
  ChartConfig,
  ItemMetadata,
  ArbitraryComponentConfig,
  RAQIV2UIComponent,
} from '@modules/experience-analytics-shared';
import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import {
  RAQIV2ChartResourceType,
  RAQIV2BreakdownValue,
  OwnerType,
} from '@modules/clients/analytics';
import { translationKey, TranslationKeyToFormattedText } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Item, urls } from '@modules/miscellaneous/common';
import { ThumbnailClient, ThumbnailTypes, ReturnPolicy } from '@rbx/thumbnails';
import { FormatAvatarItemTypeRaw } from '@modules/avatar-analytics/components/AvatarItemTypeTranslationKeys';
import { AvatarItemTargetType, AvatarItemType } from '@modules/clients/analytics/avatarItemTypes';

export type CatalogItemDetailsMap = Map<
  string,
  { name: string; taxonomy: string; assetType?: number; bundleType?: number; itemCreatedUtc?: Date }
>;

export type OwnerOverrideParams = {
  ownerType?: OwnerType;
  ownerId?: number;
};

export type AvatarItemDetailsClient = {
  getCachedItemDetails: (assetIds: number[], bundleIds: number[]) => Promise<CatalogItemDetailsMap>;
};

export interface ParsedAvatarItemKey {
  itemId: number;
  targetType: AvatarItemTargetType;
}

/**
 * Normalizes the target type from RAQI V2 breakdown values to our expected enum values.
 * The backend may return values like 'Asset' or 'Asset_2' which need to be normalized.
 */
const normalizeTargetTypeFromBreakdown = (targetType: string): AvatarItemTargetType => {
  if (targetType === AvatarItemTargetType.AssetItem || targetType === AvatarItemTargetType.Bundle) {
    return targetType;
  }
  if (targetType.startsWith('Bundle')) {
    return AvatarItemTargetType.Bundle;
  }
  return AvatarItemTargetType.AssetItem;
};

const parseAvatarItemIdBreakdownValue = (
  data: RAQIV2BreakdownValue[],
): ParsedAvatarItemKey | undefined => {
  const avatarItemIdValue = data.find((d) => d.dimension === RAQIV2Dimension.AvatarItemId);
  const avatarItemTargetTypeValue = data.find(
    (d) => d.dimension === RAQIV2Dimension.AvatarItemTargetType,
  );

  if (!avatarItemIdValue?.value || !avatarItemTargetTypeValue?.value) {
    return undefined;
  }

  const itemId = parseInt(avatarItemIdValue.value, 10);
  if (Number.isNaN(itemId)) {
    return undefined;
  }

  return {
    itemId,
    targetType: normalizeTargetTypeFromBreakdown(avatarItemTargetTypeValue.value),
  };
};

export const keyToString = (key: ParsedAvatarItemKey): string => `${key.targetType}_${key.itemId}`;

type RowWithBreakdown = { data: RAQIV2BreakdownValue[] };

/**
 * Parses table rows into avatar item keys and splits item IDs by target type (asset vs bundle).
 * Use when multiple columns need to call getCachedItemDetails for the same request rows.
 */
const parseRowsToItemIds = (
  rows: RowWithBreakdown[],
): { parsedKeys: ParsedAvatarItemKey[]; assetIds: number[]; bundleIds: number[] } => {
  const parsedKeys = rows
    .map(({ data }) => parseAvatarItemIdBreakdownValue(data))
    .filter((k): k is ParsedAvatarItemKey => k !== undefined);
  const assetIds = parsedKeys
    .filter((k) => k.targetType !== AvatarItemTargetType.Bundle)
    .map((k) => k.itemId);
  const bundleIds = parsedKeys
    .filter((k) => k.targetType === AvatarItemTargetType.Bundle)
    .map((k) => k.itemId);
  return { parsedKeys, assetIds, bundleIds };
};

const getItemTypeFromTargetType = (targetType: AvatarItemTargetType): Item => {
  return targetType === AvatarItemTargetType.Bundle ? Item.Bundle : Item.CatalogAsset;
};

const getAnalyticsPageUrl = (
  targetType: AvatarItemTargetType,
  itemId: number,
  ownerOverrideParams?: OwnerOverrideParams,
): string => {
  const itemType = targetType === AvatarItemTargetType.Bundle ? 'bundle' : 'catalog';
  const params = new URLSearchParams({ [AnalyticsQueryParams.RangeType]: DateRangeType.Last7Days });
  if (ownerOverrideParams?.ownerType) {
    params.set(AnalyticsQueryParams.OverrideOwnerType, ownerOverrideParams.ownerType);
  }
  if (ownerOverrideParams?.ownerId) {
    params.set(AnalyticsQueryParams.OverrideOwnerId, String(ownerOverrideParams.ownerId));
  }
  return `/dashboard/creations/${itemType}/${itemId}/analytics?${params.toString()}`;
};

const buildGetTaxonomyData = (client: AvatarItemDetailsClient) => {
  return async (
    request: PaginatedColumnRequest<RAQIV2BreakdownValue[], RAQIV2TableRowID, string>,
  ): Promise<PaginationResponse<RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>>> => {
    const { rows } = request;
    if (!rows.length) return { values: [], total: 0, nextPaginationToken: '' };

    const { assetIds, bundleIds } = parseRowsToItemIds(rows);

    try {
      // Fetch item details and thumbnails in parallel
      const catalogItemDetailsMap = await (assetIds.length + bundleIds.length > 0
        ? client.getCachedItemDetails(assetIds, bundleIds)
        : undefined);

      const values: RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>[] = rows.map(
        ({ id, data }) => {
          const parsed = parseAvatarItemIdBreakdownValue(data);
          let keyStr = '';
          let taxonomy = '';
          if (parsed) {
            keyStr = keyToString(parsed);
            taxonomy = catalogItemDetailsMap?.get(keyStr)?.taxonomy ?? '';
          }

          return {
            rowId: id,
            data: {
              type: ColumnType.Text,
              value: taxonomy,
              width: 100,
            },
            rowData: data,
          };
        },
      );
      return { values, total: values.length, nextPaginationToken: '' };
    } catch {
      logAnalyticsError('avatar items get taxonomy');
      const values: RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>[] = rows.map(
        ({ id, data }) => ({
          rowId: id,
          data: {
            type: ColumnType.Text,
            value: '',
            width: 100,
          },
          rowData: data,
        }),
      );
      return { values, total: values.length, nextPaginationToken: '' };
    }
  };
};

const buildGetNameData = (
  client: AvatarItemDetailsClient,
  ownerOverrideParams?: OwnerOverrideParams,
) => {
  return async (
    request: PaginatedColumnRequest<RAQIV2BreakdownValue[], RAQIV2TableRowID, string>,
  ): Promise<PaginationResponse<RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>>> => {
    const { rows } = request;
    if (!rows.length) return { values: [], total: 0, nextPaginationToken: '' };

    const { parsedKeys, assetIds, bundleIds } = parseRowsToItemIds(rows);

    try {
      // Fetch item details and thumbnails in parallel
      const [itemDetails, thumbnailResults] = await Promise.all([
        assetIds.length > 0 || bundleIds.length > 0
          ? client.getCachedItemDetails(assetIds, bundleIds)
          : undefined,
        Promise.all(
          parsedKeys.map(async (key) => {
            try {
              const { imageUrl } = await ThumbnailClient.getThumbnailImage(
                key.targetType === AvatarItemTargetType.Bundle
                  ? ThumbnailTypes.bundleThumbnail
                  : ThumbnailTypes.assetThumbnail,
                key.itemId,
                ReturnPolicy.PlaceHolder,
              );
              return { k: keyToString(key), imageUrl: imageUrl || '' };
            } catch {
              return { k: keyToString(key), imageUrl: '' };
            }
          }),
        ),
      ]);

      const keyStringToImageUrl = new Map<string, string>();
      thumbnailResults.forEach(({ k, imageUrl }) => {
        keyStringToImageUrl.set(k, imageUrl);
      });

      const values: RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>[] = rows.map(
        ({ id, data }) => {
          const parsed = parseAvatarItemIdBreakdownValue(data);
          const keyStr = parsed ? keyToString(parsed) : '';
          const name = itemDetails?.get(keyStr)?.name ?? '';
          const imageUrl = keyStringToImageUrl.get(keyStr) || '';
          const link = parsed
            ? getAnalyticsPageUrl(parsed.targetType, parsed.itemId, ownerOverrideParams)
            : undefined;

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
      logAnalyticsError('avatar items get metadata');
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

const buildGetCategoryData = (
  client: AvatarItemDetailsClient,
  translate: TranslationKeyToFormattedText,
) => {
  return async (
    request: PaginatedColumnRequest<RAQIV2BreakdownValue[], RAQIV2TableRowID, string>,
  ): Promise<PaginationResponse<RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>>> => {
    const { rows } = request;
    if (!rows.length) return { values: [], total: 0, nextPaginationToken: '' };

    const { assetIds, bundleIds } = parseRowsToItemIds(rows);

    try {
      const itemDetails = await client.getCachedItemDetails(assetIds, bundleIds);
      const values: RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>[] = rows.map(
        ({ id, data }) => {
          const parsed = parseAvatarItemIdBreakdownValue(data);
          const keyStr = parsed ? keyToString(parsed) : '';
          const item = itemDetails?.get(keyStr);
          const category = item?.assetType ?? item?.bundleType;
          const categoryText = category
            ? translate(
                FormatAvatarItemTypeRaw(
                  parsed?.targetType === AvatarItemTargetType.AssetItem
                    ? (`Asset_${category}` as AvatarItemType)
                    : (`Bundle_${category}` as AvatarItemType),
                ),
              )
            : '';

          return {
            rowId: id,
            data: {
              type: ColumnType.Text,
              value: categoryText,
            },
            rowData: data,
          };
        },
      );
      return { values, total: values.length, nextPaginationToken: '' };
    } catch {
      logAnalyticsError('avatar items get category');
      const values: RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>[] = rows.map(
        ({ id, data }) => ({
          rowId: id,
          data: {
            type: ColumnType.Text,
            value: '',
            width: 100,
          },
          rowData: data,
        }),
      );
      return { values, total: values.length, nextPaginationToken: '' };
    }
  };
};

const buildGetCreatedTimeData = (client: AvatarItemDetailsClient) => {
  return async (
    request: PaginatedColumnRequest<RAQIV2BreakdownValue[], RAQIV2TableRowID, string>,
  ): Promise<PaginationResponse<RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>>> => {
    const { rows } = request;
    if (!rows.length) return { values: [], total: 0, nextPaginationToken: '' };

    const { assetIds, bundleIds } = parseRowsToItemIds(rows);

    try {
      const itemDetails = await client.getCachedItemDetails(assetIds, bundleIds);
      const values: RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>[] = rows.map(
        ({ id, data }) => {
          const parsed = parseAvatarItemIdBreakdownValue(data);
          const keyStr = parsed ? keyToString(parsed) : '';
          const createdTime = itemDetails?.get(keyStr)?.itemCreatedUtc ?? new Date(0);

          return {
            rowId: id,
            data: {
              type: ColumnType.Date,
              value: createdTime,
            },
            rowData: data,
          };
        },
      );
      return { values, total: values.length, nextPaginationToken: '' };
    } catch {
      logAnalyticsError('avatar items get created time');
      const values: RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>[] = rows.map(
        ({ id, data }) => ({
          rowId: id,
          data: {
            type: ColumnType.Date,
            value: new Date(0),
          },
          rowData: data,
        }),
      );
      return { values, total: values.length, nextPaginationToken: '' };
    }
  };
};

const makeGetItemMetadataForSummaryCard =
  (client: AvatarItemDetailsClient) =>
  async (breakdowns: RAQIV2BreakdownValue[]): Promise<ItemMetadata> => {
    const parsed = parseAvatarItemIdBreakdownValue(breakdowns);
    if (!parsed) {
      return {
        itemId: 0,
        itemType: Item.CatalogAsset,
      };
    }

    const itemType = getItemTypeFromTargetType(parsed.targetType);
    const url = urls.getUrlForItemType(itemType, parsed.itemId) ?? undefined;

    // Fetch item name from catalog
    let name: string | undefined;
    try {
      const assetIds = parsed.targetType === AvatarItemTargetType.AssetItem ? [parsed.itemId] : [];
      const bundleIds = parsed.targetType === AvatarItemTargetType.Bundle ? [parsed.itemId] : [];
      const itemDetails = await client.getCachedItemDetails(assetIds, bundleIds);
      name = itemDetails?.get(keyToString(parsed))?.name;
    } catch {
      // Fallback to undefined name if fetch fails
    }

    return {
      itemId: parsed.itemId,
      url,
      itemType,
      name,
    };
  };

export const buildAvatarItemPageConfig = (
  owner: { ownerType: OwnerType; ownerId: number },
  dateDescriptionElement: React.ReactNode,
  translate: TranslationKeyToFormattedText,
  client: AvatarItemDetailsClient,
  showTaxonomyOnAvatarItemAnalyticsTab: boolean,
  transactionPageUrl?: string,
  ownerOverrideParams?: OwnerOverrideParams,
): CreatorAnalyticsEmbeddedSurfaceConfig => {
  const dateDescriptionConfig: ArbitraryComponentConfig = {
    type: AnalyticsComponentType.NonGeneric,
    metrics: [],
    renderer: {
      type: 'isolated',
      render: () => dateDescriptionElement as React.JSX.Element,
    },
  };

  const getNameColumn = () =>
    ({
      key: 'AvatarItemNameColumn',
      titleKey: translationKey('Label.AvatarItems', TranslationNamespace.Analytics),
      columnType: ColumnType.Image,
      getData: buildGetNameData(client, ownerOverrideParams),
    }) as const satisfies TAnalyticsCustomTableColumnConfig;

  const getTaxonomyColumn = () =>
    ({
      key: 'AvatarItemTaxonomyColumn',
      titleKey: translationKey('Label.Category', TranslationNamespace.ConfigureItem),
      columnType: ColumnType.Text,
      getData: buildGetTaxonomyData(client),
    }) as const satisfies TAnalyticsCustomTableColumnConfig;

  const getCategoryColumn = () =>
    ({
      key: 'AvatarItemCategoryColumn',
      titleKey: showTaxonomyOnAvatarItemAnalyticsTab
        ? translationKey('Label.ItemType', TranslationNamespace.ConfigureItem)
        : translationKey('Label.Category', TranslationNamespace.AvatarAnalytics),
      columnType: ColumnType.Text,
      getData: buildGetCategoryData(client, translate),
    }) as const satisfies TAnalyticsCustomTableColumnConfig;

  const getCreatedTimeColumn = () =>
    ({
      key: 'AvatarItemCreatedTimeColumn',
      titleKey: translationKey('Label.CreatedTime', TranslationNamespace.AvatarAnalytics),
      columnType: ColumnType.Date,
      getData: buildGetCreatedTimeData(client),
    }) as const satisfies TAnalyticsCustomTableColumnConfig;

  const salesColumn = {
    key: `AvatarItem${RAQIV2Metric.ItemTotalTransactionCount}`,
    metric: RAQIV2Metric.ItemTotalTransactionCount,
    overrides: {
      granularity: { override: RAQIV2MetricGranularity.None },
      breakdown: {
        override: [RAQIV2Dimension.AvatarItemId, RAQIV2Dimension.AvatarItemTargetType],
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
    key: `AvatarItem${RAQIV2Metric.ItemTotalCreatorEarning}`,
    metric: RAQIV2Metric.ItemTotalCreatorEarning,
    overrides: {
      granularity: { override: RAQIV2MetricGranularity.None },
      breakdown: {
        override: [RAQIV2Dimension.AvatarItemId, RAQIV2Dimension.AvatarItemTargetType],
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
    titleKey: translationKey('Title.TotalRevenue', TranslationNamespace.Analytics),
    metric: RAQIV2Metric.ItemTotalCreatorEarning,
    overrides: {
      breakdown: {
        override: [
          RAQIV2UIPseudoDimension.TopAvatarItemIdForTotalCreatorEarning,
          RAQIV2Dimension.AvatarItemTargetType,
        ],
      },
    },
  } as const satisfies ChartConfig;

  const salesChartConfig: ChartConfig = {
    type: AnalyticsComponentType.Chart,
    chartType: ChartType.Spline,
    titleKey: translationKey('Title.TotalSales', TranslationNamespace.Analytics),
    metric: RAQIV2Metric.ItemTotalTransactionCount,
    overrides: {
      breakdown: {
        override: [
          RAQIV2UIPseudoDimension.TopAvatarItemIdForTotalTransactionCount,
          RAQIV2Dimension.AvatarItemTargetType,
        ],
      },
    },
  } as const satisfies ChartConfig;

  const tabbedChartConfig: TabbedChartConfig = {
    type: AnalyticsComponentType.TabbedChart,
    titleKey: translationKey('Heading.TopAvatarItems', TranslationNamespace.Analytics),
    tabs: [
      {
        chart: revenueChartConfig,
        tabLabel: translationKey('Title.TotalRevenue', TranslationNamespace.Analytics),
      },
      {
        chart: salesChartConfig,
        tabLabel: translationKey('Title.TotalSales', TranslationNamespace.Analytics),
      },
    ],
  } as const satisfies TabbedChartConfig;

  const topSellingSummaryCard: AnalyticsSummaryCardConfig = {
    type: AnalyticsComponentType.SummaryCard,
    cardType: RAQIV2SummaryCardType.Item,
    metric: RAQIV2Metric.ItemTotalTransactionCount,
    summaryType: { type: RAQIV2SummaryType.Total },
    overrides: {
      breakdown: {
        override: [RAQIV2Dimension.AvatarItemId, RAQIV2Dimension.AvatarItemTargetType],
      },
      limit: { override: 1 },
      granularity: { override: RAQIV2MetricGranularity.None },
    },
    getItemMetadata: makeGetItemMetadataForSummaryCard(client),
    label: {
      key: translationKey('Label.TopSellingItem', TranslationNamespace.AvatarAnalytics),
      type: 'simple',
    },
  } as const satisfies AnalyticsSummaryCardConfig;

  const topGrossingSummaryCard: AnalyticsSummaryCardConfig = {
    type: AnalyticsComponentType.SummaryCard,
    cardType: RAQIV2SummaryCardType.Item,
    metric: RAQIV2Metric.ItemTotalCreatorEarning,
    summaryType: { type: RAQIV2SummaryType.Total },
    overrides: {
      breakdown: {
        override: [RAQIV2Dimension.AvatarItemId, RAQIV2Dimension.AvatarItemTargetType],
      },
      limit: { override: 1 },
      granularity: { override: RAQIV2MetricGranularity.None },
    },
    getItemMetadata: makeGetItemMetadataForSummaryCard(client),
    label: {
      key: translationKey('Label.TopGrossingItem', TranslationNamespace.AvatarAnalytics),
      type: 'simple',
    },
  } as const satisfies AnalyticsSummaryCardConfig;

  const tableConfig: TAnalyticsNonSerializableTableConfig = {
    type: AnalyticsComponentType.Table,
    titleKey: translationKey('Heading.TopAvatarItems', TranslationNamespace.Analytics),
    exportButtonConfig: transactionPageUrl
      ? {
          link: transactionPageUrl,
          definitionTooltipKey: translationKey(
            'Description.ExportFromTransactionPage',
            TranslationNamespace.Analytics,
          ),
        }
      : undefined,
    tableConfig: {
      stickyHeader: true,
      stickyFirstColumn: true,
      columnDivider: false,
      defaultActiveSort: `AvatarItem${RAQIV2Metric.ItemTotalCreatorEarning}`,
    },
    breakdowns: [RAQIV2Dimension.AvatarItemId, RAQIV2Dimension.AvatarItemTargetType],
    hideBreakdownLabelColumns: true,
    pagination: { pageSizeOptions: [10, 20, 50, 100], initialPageSize: 10 },
    dataColumns: showTaxonomyOnAvatarItemAnalyticsTab
      ? [
          getNameColumn(),
          getCategoryColumn(),
          getTaxonomyColumn(),
          getCreatedTimeColumn(),
          salesColumn,
          revenueColumn,
        ]
      : [getNameColumn(), getCategoryColumn(), getCreatedTimeColumn(), salesColumn, revenueColumn],
  } as const satisfies TAnalyticsNonSerializableTableConfig;

  const bodyItems: RAQIV2UIComponent[] = [
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [dateDescriptionConfig],
    },
    {
      type: RAQIV2SpecialLayoutType.RowLayout as const,
      items: [topSellingSummaryCard, topGrossingSummaryCard],
    },
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [tabbedChartConfig],
    },
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [tableConfig],
    },
  ];

  return {
    mode: CreatorAnalyticsPageMode.Embedded,
    resourceTypes: [
      owner.ownerType === OwnerType.User
        ? RAQIV2ChartResourceType.User
        : RAQIV2ChartResourceType.Group,
    ],
    timeRangeOptions: {
      type: 'dateRange',
      supportedRanges: [
        DateRangeType.Last7Days,
        DateRangeType.Last28Days,
        DateRangeType.Last56Days,
        DateRangeType.Last90Days,
        DateRangeType.Custom,
      ],
      defaultRange: DateRangeType.Last28Days,
      excludeEndDateInRange: false,
      maxEndDateOffset: 0,
      maxStartDateOffsetDays: 365,
    } as const satisfies AnalyticsPageConfigDateOptions,
    surfaceAnnotationOptions: {
      supportedAnnotationTypes: [],
      defaultAnnotationTypes: [],
      showAnnotationsControl: false,
    } as const satisfies AnalyticsPageConfigAnnotationOptions,
    granularity: {
      fixed: RAQIV2MetricGranularity.OneDay,
    },
    filterDimensions: [
      RAQIV2Dimension.AvatarAssetBundleType,
      RAQIV2Dimension.AvatarItemLimitedStatus,
      RAQIV2Dimension.AvatarItemTimedOptions,
    ],
    breakdownDimensions: [],
    body: bodyItems,
  };
};
