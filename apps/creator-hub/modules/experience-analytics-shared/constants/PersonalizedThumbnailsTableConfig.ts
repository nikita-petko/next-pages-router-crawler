import { RAQIV2MetricValueType } from '@rbx/creator-hub-analytics-config';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { NumberContext } from '@modules/charts-generic/charts/numberFormatters';
import { TableCellBackgroundColor } from '@modules/charts-generic/charts/options';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import {
  CellBackgroundType,
  ColumnType,
} from '@modules/charts-generic/tables/types/GenericColumnType';
import type { TableConfig } from '@modules/charts-generic/tables/types/GenericTableType';
import { TableSortOrder } from '@modules/charts-generic/tables/types/TableSort';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isComputedMetric, getUIMetricFromAtomicMetricLike } from '../types/ComputedMetric';
import { generateAnalyticsNumberFormattingSpec } from '../utils/analyticsNumberFormattingSpec';
import { getIsPositiveGoodFromMetricLike } from '../utils/metricLikeSemantics';
import getAnalyticsMetricDisplayConfig from './AnalyticsMetricDisplayConfig';
import {
  tableColumnConfigThumbnailImpressions,
  tableColumnConfigThumbnailQualifiedPlays,
  tableColumnConfigThumbnailAVGPlayTime,
  tableColumnConfigThumbnailQualifiedPTR,
  tableColumnConfigThumbnailWinningSegments,
} from './chart-configs/PredefinedTableColumnConfigLiterals';
import type { TAnalyticsMetricTableColumnConfig } from './RAQIV2PredefinedTableColumnConfig';
import { isMetricTableColumnConfig } from './RAQIV2PredefinedTableColumnConfig';

export enum PersonalizedThumbnailsNonRAQITableColumnKey {
  Status = 'Status',
  ActiveCheckBox = 'ActiveCheckBox',
  Thumbnail = 'Thumbnail',
  ThumbnailAssetId = 'ThumbnailAssetId',
  OptionMenu = 'OptionMenu',
}
const orderedThumbnailTableRAQIColumnKeys = [
  tableColumnConfigThumbnailImpressions.key,
  tableColumnConfigThumbnailQualifiedPlays.key,
  tableColumnConfigThumbnailAVGPlayTime.key,
  tableColumnConfigThumbnailQualifiedPTR.key,
  tableColumnConfigThumbnailWinningSegments.key,
] as const;
type RAQIV2CompatibleColumnKey = (typeof orderedThumbnailTableRAQIColumnKeys)[number];

export type TPersonalizedThumbnailsTableColumnKey =
  | PersonalizedThumbnailsNonRAQITableColumnKey
  | RAQIV2CompatibleColumnKey;

export const isPersonalizedThumbnailsColumnKeyRAQIV2Compatible = (
  columnKey: TPersonalizedThumbnailsTableColumnKey,
): columnKey is RAQIV2CompatibleColumnKey => {
  return orderedThumbnailTableRAQIColumnKeys.includes(columnKey as RAQIV2CompatibleColumnKey);
};

export const getColumnConfigByKey = (
  columnKey: RAQIV2CompatibleColumnKey,
): TAnalyticsMetricTableColumnConfig => {
  switch (columnKey) {
    case tableColumnConfigThumbnailImpressions.key:
      return tableColumnConfigThumbnailImpressions;
    case tableColumnConfigThumbnailQualifiedPlays.key:
      return tableColumnConfigThumbnailQualifiedPlays;
    case tableColumnConfigThumbnailAVGPlayTime.key:
      return tableColumnConfigThumbnailAVGPlayTime;
    case tableColumnConfigThumbnailQualifiedPTR.key:
      return tableColumnConfigThumbnailQualifiedPTR;
    case tableColumnConfigThumbnailWinningSegments.key:
      return tableColumnConfigThumbnailWinningSegments;
    default: {
      const exhaustiveCheck: never = columnKey;
      throw new Error(`Unknown thumbnail table column key: ${exhaustiveCheck}`);
    }
  }
};

const getRAQIV2ColumnConfigOverride = (
  config: TAnalyticsMetricTableColumnConfig,
): Pick<
  TableColumnConfig<TPersonalizedThumbnailsTableColumnKey>,
  'analyticsNumberFormattingSpec' | 'sort' | 'columnType'
> => {
  const predefinedColumnConfig = config;
  if (isMetricTableColumnConfig(predefinedColumnConfig)) {
    const { metric } = predefinedColumnConfig;
    // Computed metrics always produce numeric output (the result of evaluating
    // the formula); atomic metrics inspect their display config to discover
    // numeric vs string-array value types.
    const valueType = isComputedMetric(metric)
      ? RAQIV2MetricValueType.Numeric
      : getAnalyticsMetricDisplayConfig(getUIMetricFromAtomicMetricLike(metric)).valueType;
    if (valueType === RAQIV2MetricValueType.Numeric) {
      return {
        analyticsNumberFormattingSpec: generateAnalyticsNumberFormattingSpec({
          metric,
          context: NumberContext.TableDataPoint,
        }),
        sort: {
          direction: getIsPositiveGoodFromMetricLike(metric)
            ? TableSortOrder.desc
            : TableSortOrder.asc,
        },
        columnType: ColumnType.Number,
      };
    }
  }

  return {
    columnType: ColumnType.Text,
  };
};

export const getOrderedThumbnailTableColumnKeys = ({
  inCompactView,
  inEditingMode,
  allowAssetIdColumn,
}: {
  inCompactView: boolean;
  inEditingMode: boolean;
  allowAssetIdColumn: boolean;
}) => {
  const statusOrCheckBoxColumn = inEditingMode
    ? PersonalizedThumbnailsNonRAQITableColumnKey.ActiveCheckBox
    : PersonalizedThumbnailsNonRAQITableColumnKey.Status;

  const orderedColumnKeys = inCompactView
    ? [
        PersonalizedThumbnailsNonRAQITableColumnKey.Thumbnail,
        PersonalizedThumbnailsNonRAQITableColumnKey.ThumbnailAssetId,
        PersonalizedThumbnailsNonRAQITableColumnKey.OptionMenu,
        statusOrCheckBoxColumn,
        ...orderedThumbnailTableRAQIColumnKeys,
      ]
    : [
        statusOrCheckBoxColumn,
        PersonalizedThumbnailsNonRAQITableColumnKey.Thumbnail,
        PersonalizedThumbnailsNonRAQITableColumnKey.ThumbnailAssetId,
        ...orderedThumbnailTableRAQIColumnKeys,
        PersonalizedThumbnailsNonRAQITableColumnKey.OptionMenu,
      ];

  return allowAssetIdColumn
    ? orderedColumnKeys
    : orderedColumnKeys.filter(
        (key) => key !== PersonalizedThumbnailsNonRAQITableColumnKey.ThumbnailAssetId,
      );
};

export const PersonalizedThumbnailsTableConfig: TableConfig<TPersonalizedThumbnailsTableColumnKey> =
  {
    stickyFirstColumn: true,
    columnDivider: true,
    firstDataRowIsSummary: true,
  };

export const PersonalizedThumbnailsTableColumnConfigs: Record<
  TPersonalizedThumbnailsTableColumnKey,
  TableColumnConfig<TPersonalizedThumbnailsTableColumnKey>
> = {
  [PersonalizedThumbnailsNonRAQITableColumnKey.Status]: {
    titleKey: translationKey('Title.Table.Status', TranslationNamespace.Analytics),
    tooltipKey: translationKey(
      'Description.Table.ThumbnailPersonalizationStatus',
      TranslationNamespace.Analytics,
    ),
    columnKey: PersonalizedThumbnailsNonRAQITableColumnKey.Status,
    columnType: ColumnType.Status,
    widthWeight: 26,
  },
  [PersonalizedThumbnailsNonRAQITableColumnKey.ActiveCheckBox]: {
    titleKey: translationKey('Title.Table.Active', TranslationNamespace.Analytics),
    tooltipKey: translationKey(
      'Description.Table.ThumbnailPersonalizationStatus',
      TranslationNamespace.Analytics,
    ),
    columnKey: PersonalizedThumbnailsNonRAQITableColumnKey.ActiveCheckBox,
    columnType: ColumnType.Selection,
    widthWeight: 22,
  },
  [PersonalizedThumbnailsNonRAQITableColumnKey.Thumbnail]: {
    titleKey: translationKey('Title.Table.Thumbnail', TranslationNamespace.Analytics),
    columnKey: PersonalizedThumbnailsNonRAQITableColumnKey.Thumbnail,
    columnType: ColumnType.Image,
    widthWeight: 30,
    endAdormentColumnKeyInCompactView: PersonalizedThumbnailsNonRAQITableColumnKey.OptionMenu,
  },
  [PersonalizedThumbnailsNonRAQITableColumnKey.ThumbnailAssetId]: {
    titleKey: translationKey('Title.Table.ThumbnailAssetId', TranslationNamespace.Analytics),
    tooltipKey: translationKey(
      'Description.Table.ThumbnailAssetId',
      TranslationNamespace.Analytics,
    ),
    columnKey: PersonalizedThumbnailsNonRAQITableColumnKey.ThumbnailAssetId,
    columnType: ColumnType.Number,
    widthWeight: 25,
  },
  [tableColumnConfigThumbnailWinningSegments.key]: {
    titleKey: translationKey('Title.Table.WinningSegment', TranslationNamespace.Analytics),
    tooltipKey: translationKey(
      'Description.Table.ThumbnailWinningSegments',
      TranslationNamespace.Analytics,
    ),
    columnKey: tableColumnConfigThumbnailWinningSegments.key,
    columnType: ColumnType.Text,
    widthWeight: 40,
  },
  [tableColumnConfigThumbnailImpressions.key]: {
    titleKey: translationKey('Title.Table.Impressions', TranslationNamespace.Analytics),
    tooltipKey: translationKey(
      'Description.Table.ThumbnailImpressions',
      TranslationNamespace.Analytics,
    ),
    columnKey: tableColumnConfigThumbnailImpressions.key,
    widthWeight: 40,
    ...getRAQIV2ColumnConfigOverride(tableColumnConfigThumbnailImpressions),
  },
  [tableColumnConfigThumbnailQualifiedPlays.key]: {
    titleKey: translationKey('Title.Table.QPlays', TranslationNamespace.Analytics),
    columnKey: tableColumnConfigThumbnailQualifiedPlays.key,
    tooltipKey: translationKey(
      'Description.Table.ThumbnailQualifiedPlays',
      TranslationNamespace.Analytics,
    ),
    widthWeight: 40,
    ...getRAQIV2ColumnConfigOverride(tableColumnConfigThumbnailQualifiedPlays),
  },
  [tableColumnConfigThumbnailQualifiedPTR.key]: {
    titleKey: translationKey('Title.Table.QPTR', TranslationNamespace.Analytics),
    tooltipKey: translationKey(
      'Description.Table.ThumbnailQualifiedPTR',
      TranslationNamespace.Analytics,
    ),
    columnKey: tableColumnConfigThumbnailQualifiedPTR.key,
    widthWeight: 40,
    ...getRAQIV2ColumnConfigOverride(tableColumnConfigThumbnailQualifiedPTR),
    headerBackground: {
      type: CellBackgroundType.ConstantFill,
      color: TableCellBackgroundColor.Highlight,
    },
    cellBackground: {
      type: CellBackgroundType.ConstantFill,
      color: TableCellBackgroundColor.Highlight,
    },
  },
  [tableColumnConfigThumbnailAVGPlayTime.key]: {
    titleKey: translationKey('Title.Table.AVGPlayTime', TranslationNamespace.Analytics),
    tooltipKey: translationKey(
      'Description.Table.ThumbnailAVGPlayTime',
      TranslationNamespace.Analytics,
    ),
    columnKey: tableColumnConfigThumbnailAVGPlayTime.key,
    widthWeight: 40,
    ...getRAQIV2ColumnConfigOverride(tableColumnConfigThumbnailAVGPlayTime),
  },
  [PersonalizedThumbnailsNonRAQITableColumnKey.OptionMenu]: {
    titleKey: translationKey('Title.Table.Options', TranslationNamespace.Analytics),
    columnKey: PersonalizedThumbnailsNonRAQITableColumnKey.OptionMenu,
    columnType: ColumnType.Actions,
    widthWeight: 20,
  },
};
