import { useCallback, useMemo } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { useTranslation, withTranslation } from '@rbx/intl';
import { ThumbnailTypes } from '@rbx/thumbnails';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import type { RAQIV2TableRowID } from '@modules/experience-analytics-shared/adapters/genericRAQIV2TableAdapter';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import type {
  PaginatedColumnRequest,
  RowDataResponse,
} from '@modules/experience-analytics-shared/components/RAQIV2/table/GenericDataTable';
import type { TRAQIV2NumericUIMetric } from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
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
import {
  useItemMonetizationClient,
  type ItemMonetizationApiClient,
} from '@modules/experience-monetization/context/ItemMonetizationClientProvider';
import parseProductKeyBreakdownValue, {
  type ParsedProductKey,
} from '@modules/experience-monetization/utils/parseProductKeyBreakdownValue';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const createSummaryCard = (
  summaryKey: string,
  metric: TRAQIV2NumericUIMetric,
): AnalyticsSummaryCardConfig =>
  ({
    type: AnalyticsComponentType.SummaryCard,
    summaryKey,
    cardType: RAQIV2SummaryCardType.Metric,
    metric,
    summaryType: { type: RAQIV2SummaryType.Total },
    overrides: { granularity: { override: RAQIV2MetricGranularity.None } },
    label: {
      key: translationKey(`Label.Metric.${metric}`, TranslationNamespace.Analytics),
      tooltip: translationKey(`Description.${metric}`, TranslationNamespace.Analytics),
      type: 'simple',
    },
  }) as const satisfies AnalyticsSummaryCardConfig;

const summaryCardRevenue = createSummaryCard('ShopsRevenue', RAQIV2Metric.PersonalizedShopsRevenue);
const summaryCardImpressions = createSummaryCard(
  'ShopsImpressions',
  RAQIV2Metric.PersonalizedShopsImpressions,
);
const summaryCardPurchases = createSummaryCard(
  'ShopsPurchases',
  RAQIV2Metric.PersonalizedShopsPurchases,
);
const summaryCardConversionRate = createSummaryCard(
  'ShopsConversionRate',
  RAQIV2Metric.PersonalizedShopsConversionRate,
);

const shopsRevenueChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.ShopRevenue', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.PersonalizedShopsRevenue',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.PersonalizedShopsRevenue,
  overrides: {},
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

// For each row in the top items table, resolve the row's ProductKey to a name and thumbnail src.
// Uses the ItemMonetizationApiClient to fetch the names and thumbnails for game passes and developer products.
// The client internally caches the results and uses the developer products and game passes clients.
const buildTopItemsNameAndThumbnail =
  (universeId: number, client: ItemMonetizationApiClient) =>
  async (
    request: PaginatedColumnRequest<RAQIV2BreakdownValue[], RAQIV2TableRowID, string>,
  ): Promise<PaginationResponse<RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>>> => {
    const { rows } = request;
    if (!rows.length) {
      return { values: [], total: 0, nextPaginationToken: '' };
    }

    const parsedRows = rows.map(({ id, data }) => ({
      id,
      data,
      parsed: parseProductKeyBreakdownValue(data),
    }));

    const collectIds = (subtype: 'gamepass' | 'devproduct'): number[] =>
      parsedRows
        .map(({ parsed }) => (parsed && parsed.subtype === subtype ? parsed.itemId : undefined))
        .filter((itemId): itemId is number => itemId !== undefined);

    // The client dedupes and short-circuits empty id lists internally.
    try {
      const [gamePasses, developerProducts] = await Promise.all([
        client.getCachedGamePasses(universeId, collectIds('gamepass')),
        client.getCachedDeveloperProducts(universeId, collectIds('devproduct')),
      ]);

      const gamePassById = new Map(gamePasses.data.map((pass) => [pass.gamePassId, pass]));
      const developerProductById = new Map(
        developerProducts.data.map((product) => [product.productId, product]),
      );

      const thumbnailSrcs = await Promise.all(
        parsedRows.map(({ parsed }) => {
          if (parsed?.subtype === 'gamepass') {
            // Game pass thumbnails resolve from the pass id, not an asset id.
            return client.getThumbnailImageUrl(ThumbnailTypes.gamePassIcon, parsed.itemId);
          }
          if (parsed?.subtype === 'devproduct') {
            const iconImageAssetId = developerProductById.get(parsed.itemId)?.iconImageAssetId ?? 0;
            return client.getThumbnailImageUrl(ThumbnailTypes.assetThumbnail, iconImageAssetId);
          }
          return Promise.resolve('');
        }),
      );

      const values = parsedRows.map(({ id, data, parsed }, index) => {
        let name = '';
        if (parsed?.subtype === 'gamepass') {
          name = gamePassById.get(parsed.itemId)?.name ?? '';
        } else if (parsed?.subtype === 'devproduct') {
          name = developerProductById.get(parsed.itemId)?.name ?? '';
        }
        return {
          rowId: id,
          data: {
            type: ColumnType.Image as const,
            src: thumbnailSrcs[index],
            text: name,
            width: 40,
          },
          rowData: data,
        };
      });
      return { values, total: values.length, nextPaginationToken: '' };
    } catch {
      const values = parsedRows.map(({ id, data }) => ({
        rowId: id,
        data: { type: ColumnType.Image as const, src: '', width: 40 },
        rowData: data,
      }));
      return { values, total: values.length, nextPaginationToken: '' };
    }
  };

// Resolves each row's ProductKey subtype to a translated product type label.
const buildTopItemsProductTypeTranslation =
  (resolveProductType: (subtype: ParsedProductKey['subtype']) => string) =>
  async (
    request: PaginatedColumnRequest<RAQIV2BreakdownValue[], RAQIV2TableRowID, string>,
  ): Promise<PaginationResponse<RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>>> => {
    const values = request.rows.map(({ id, data }) => {
      const parsed = parseProductKeyBreakdownValue(data);
      return {
        rowId: id,
        data: { type: ColumnType.Text as const, value: resolveProductType(parsed?.subtype) },
        rowData: data,
      };
    });
    return { values, total: values.length, nextPaginationToken: '' };
  };

const topItemsSoldColumn = {
  key: 'ShopsTopItemsSold',
  metric: RAQIV2Metric.PersonalizedShopsPurchases,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: { override: [RAQIV2Dimension.ProductKey] },
    limit: { override: 500 },
  },
  sort: { isFixedOrder: true, isServerSideSorting: true },
} as const satisfies TAnalyticsMetricTableColumnConfig;

const topItemsRevenueColumn = {
  key: 'ShopsTopItemsRevenue',
  metric: RAQIV2Metric.PersonalizedShopsRevenue,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: { override: [RAQIV2Dimension.ProductKey] },
    limit: { override: 500 },
  },
  sort: { isFixedOrder: true, isServerSideSorting: true },
} as const satisfies TAnalyticsMetricTableColumnConfig;

// The analytics config needs to be built with a function instead of constructed as a constant config object
// because the config needs to be built with a translation function and an ItemMonetizationApiClient
// both of which need to be retrieved from hooks and cannot be used outside of a React component.
const buildShopsAnalyticsConfig = (
  resolveProductType: (subtype: ParsedProductKey['subtype']) => string,
  universeId: number,
  client: ItemMonetizationApiClient,
): CreatorAnalyticsEmbeddedSurfaceConfig => {
  const topItemsNameColumn = {
    key: 'ShopsTopItemsName',
    titleKey: translationKey('Label.Name', TranslationNamespace.Analytics),
    columnType: ColumnType.Image,
    getData: buildTopItemsNameAndThumbnail(universeId, client),
  } as const satisfies TAnalyticsCustomTableColumnConfig;

  const topItemsProductTypeColumn = {
    key: 'ShopsTopItemsProductType',
    titleKey: translationKey('Label.ProductType', TranslationNamespace.Analytics),
    columnType: ColumnType.Text,
    getData: buildTopItemsProductTypeTranslation(resolveProductType),
  } as const satisfies TAnalyticsCustomTableColumnConfig;

  const shopsTopItemsTable = {
    type: AnalyticsComponentType.Table,
    tableKey: 'ShopsTopItems',
    tableConfig: {
      stickyHeader: true,
      stickyFirstColumn: true,
      columnDivider: false,
      defaultActiveSort: topItemsSoldColumn.key,
    },
    breakdowns: [RAQIV2Dimension.ProductKey],
    hideBreakdownLabelColumns: true,
    pagination: { pageSizeOptions: [10, 20, 50], initialPageSize: 10 },
    dataColumns: [
      topItemsNameColumn,
      topItemsProductTypeColumn,
      topItemsSoldColumn,
      topItemsRevenueColumn,
    ],
  } as const satisfies TAnalyticsNonSerializableTableConfig;

  return {
    debugPageName: 'Shops',
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
      maxStartDateOffsetDays: 365,
    } as const satisfies AnalyticsPageConfigDateOptions,
    surfaceAnnotationOptions: {
      supportedAnnotationTypes: [],
      defaultAnnotationTypes: [],
      showAnnotationsControl: false,
    } as const satisfies AnalyticsPageConfigAnnotationOptions,
    granularity: { fixed: RAQIV2MetricGranularity.OneDay },
    filterDimensions: [],
    breakdownDimensions: [],
    body: [
      {
        type: RAQIV2SpecialLayoutType.RowLayout,
        items: [
          summaryCardRevenue,
          summaryCardImpressions,
          summaryCardPurchases,
          summaryCardConversionRate,
        ],
        stylingOverride: {
          // Override the layout's default MUI `spacing` so it doesn't fight the grid `gap`.
          spacing: 0,
          // Stretch each summary card to 220px but wrap to next row if screen is too narrow.
          style: {
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(min(220px, 100%), 220px))`,
            gap: '16px',
          },
        },
      },
      {
        type: RAQIV2SpecialLayoutType.FullWidthLayout,
        items: [shopsRevenueChart, shopsTopItemsTable],
      },
    ],
  };
};

const ShopsAnalyticsContainer = ({ universeId }: { universeId: number }) => {
  const { translateWithNamespace } = useTranslation();
  const client = useItemMonetizationClient();

  const translateProductType = useCallback(
    (subtype: ParsedProductKey['subtype']) => {
      if (subtype === 'gamepass') {
        return translateWithNamespace(TranslationNamespace.PersonalizedShop, 'Label.Pass');
      }
      if (subtype === 'devproduct') {
        return translateWithNamespace(
          TranslationNamespace.PersonalizedShop,
          'Label.DeveloperProduct',
        );
      }
      return '';
    },
    [translateWithNamespace],
  );

  const config = useMemo(
    () => buildShopsAnalyticsConfig(translateProductType, universeId, client),
    [translateProductType, universeId, client],
  );
  return <CreatorAnalyticsLayout config={config} />;
};

export default withTranslation(ShopsAnalyticsContainer, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.PersonalizedShop,
]);
