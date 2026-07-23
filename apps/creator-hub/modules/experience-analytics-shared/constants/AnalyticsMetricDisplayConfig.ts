import type {
  TRAQIV2Metric,
  TRAQIV2MetricDisplayConfig,
  TRAQIV2UIMetric,
} from '@rbx/creator-hub-analytics-config';
import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricDisplayConfig,
  RAQIV2MetricGranularity,
  RAQIV2MetricUnit,
  RAQIV2MetricValueType,
  RAQIV2UIMetric,
} from '@rbx/creator-hub-analytics-config';
import type { TranslationKey } from '@modules/analytics-translations/types';
import {
  translationKey,
  translationKeyWithoutNamespace,
} from '@modules/analytics-translations/wrapperFunctions';
import { TableCellBackgroundColor } from '@modules/charts-generic/charts/options';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import { CellBackgroundType } from '@modules/charts-generic/tables/types/GenericColumnType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { RAQIV2CompoundSummaryType } from '../enums/RAQIV2SummaryType';
// oxlint-disable-next-line import/no-named-as-default
import RAQIV2SummaryType from '../enums/RAQIV2SummaryType';
import type { SpecOverride } from '../utils/computeRAQIV2SpecOverride';
import AnalyticsSpecialNumberFormatting from './AnalyticsSpecialNumberFormatting';
import { NumericDataPointTransformerType } from './NumericDataPointTransformerConfig';

type ColumnDisplayConfigOverrides = {
  titleKey?: TranslationKey;
  tooltipKey?: TranslationKey;
  cellBackground?: {
    type: CellBackgroundType;
    color: TableCellBackgroundColor;
  };
  widthWeight?: number;
  columnAlignment?: TableColumnConfig<string>['columnAlignment'];
};

type BaseMetricDisplayConfig = {
  defaultTotalSummaryTypes?: RAQIV2CompoundSummaryType[];

  columnDisplayConfigOverrides?: ColumnDisplayConfigOverrides;
  exploreModeChartType?: ChartType;
  exploreModeSpecOverride?: SpecOverride;

  specialNumberFormatting?: AnalyticsSpecialNumberFormatting;

  /** ⚠️⚠️⚠️ Be extra carefaul when changing the value.
   * Some of the logging metrics are already used in production as a parameter of a logging event.
   * So make sure it's not in use before changing the value.
   *
   * By default, the value is the same as the TRAQIV2UIMetric enum value. Can be overriden to be anything.
   * e.g. Default:  'TransactionAmount' -> 'TransactionAmount'
   *      Override: 'DailyRevenue'      -> 'Robux'
   */
  loggingMetricOverride?: string;
};

// TODO(gperkins@2026-03-30): Pull `defaultTotalSummaryTypes` into the backend display.yml
// we can derive this from something like (maybe) "isSumMeaningful" next to "isPositiveGood"
const defaultBaseMetricDisplayConfig: BaseMetricDisplayConfig = {
  defaultTotalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
};

export const RAQIV2NonNumericUIMetric = [RAQIV2Metric.ThumbnailWinningSegments] as const;
export type TRAQIV2NonNumericUIMetric = (typeof RAQIV2NonNumericUIMetric)[number];
export type TRAQIV2NumericUIMetric = Exclude<TRAQIV2UIMetric, TRAQIV2NonNumericUIMetric>;

export const isRAQIV2UIMetric = (metric: string): metric is TRAQIV2UIMetric =>
  isValidEnumValue(RAQIV2Metric, metric) || isValidEnumValue(RAQIV2UIMetric, metric);

export const isNumericUIMetric = (metric: string): metric is TRAQIV2NumericUIMetric =>
  isRAQIV2UIMetric(metric) &&
  RAQIV2MetricDisplayConfig[metric]?.valueType === RAQIV2MetricValueType.Numeric;

type NumericMetricDisplayConfig = BaseMetricDisplayConfig & {
  /**
   * When available, it is used to transform the data points of the metric.
   */
  dataPointTransformerType?: NumericDataPointTransformerType;
  totalSeriesNameOverride?: TranslationKey;
};

/**
 * Frontend overrides for the codegen `unit` / `decimalPrecision`. Used when a
 * metric is ingested from the backend in one unit but should be displayed in
 * another (paired with a `dataPointTransformerType` that rescales the raw
 * values), e.g. playback seconds rendered as hours. Applied after the base
 * merge so they don't widen the merged config's required fields to `undefined`.
 */
const RAQIV2MetricUnitDisplayOverride: Partial<
  Record<TRAQIV2Metric, { unit: RAQIV2MetricUnit; decimalPrecision: number }>
> = {
  [RAQIV2Metric.VideoServiceExclusivePlaybackSeconds]: {
    unit: RAQIV2MetricUnit.Hours,
    decimalPrecision: 1,
  },
};

export enum RAQIV2MetricValueRendererType {
  WinningSegments = 'WinningSegments',
}

type NonNumericMetricDisplayConfig = BaseMetricDisplayConfig & {
  rendererType?: RAQIV2MetricValueRendererType;
  valueTranslationKeys?: Record<string, { name: TranslationKey }>;
};

const totalSummationSummary: RAQIV2CompoundSummaryType[] = [{ type: RAQIV2SummaryType.Total }];
const lastValueSummary: RAQIV2CompoundSummaryType[] = [{ type: RAQIV2SummaryType.LastValue }];

const RAQIV2NumericMetricDisplayConfig: Partial<Record<TRAQIV2Metric, NumericMetricDisplayConfig>> =
  {
    [RAQIV2Metric.CreatorRewardsAverageRobuxBookingsPerSpender]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.CreatorRewardsAverageRobuxBookingsPerSpender',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.CreatorRewardsLifetimeEstimatedAffiliatePayoutRobux]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.CreatorRewardsLifetimeEstimatedAffiliatePayoutRobux',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.CreatorRewardsLifetimeQualifiedReactivations]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.CreatorRewardsLifetimeQualifiedReactivations',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.CreatorRewardsLifetimeQualifiedSignups]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.CreatorRewardsLifetimeQualifiedSignups',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.CreatorRewardsLifetimeQualifiedSpenders]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.CreatorRewardsLifetimeQualifiedSpenders',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.EconomyTransactionAmount]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      exploreModeChartType: ChartType.Column,
      specialNumberFormatting: AnalyticsSpecialNumberFormatting.InExperienceCurrency,
    },
    [RAQIV2Metric.EconomyTransactionAmountSinks]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      exploreModeChartType: ChartType.Column,
      specialNumberFormatting: AnalyticsSpecialNumberFormatting.InExperienceCurrency,
    },
    [RAQIV2Metric.EconomyTransactionCount]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      exploreModeChartType: ChartType.Column,
    },
    [RAQIV2Metric.EconomyAverageWalletBalance]: {
      exploreModeChartType: ChartType.Spline,
      specialNumberFormatting: AnalyticsSpecialNumberFormatting.InExperienceCurrency,
    },
    [RAQIV2Metric.FunnelStepCompletionRate]: {
      columnDisplayConfigOverrides: {
        cellBackground: {
          type: CellBackgroundType.ValueOpacityFill,
          color: TableCellBackgroundColor.Positive,
        },
      },
    },
    [RAQIV2Metric.FunnelUserStepCompletionRate]: {
      columnDisplayConfigOverrides: {
        cellBackground: {
          type: CellBackgroundType.ValueOpacityFill,
          color: TableCellBackgroundColor.Positive,
        },
      },
    },
    [RAQIV2Metric.FunnelStepChurnRate]: {
      columnDisplayConfigOverrides: {
        cellBackground: {
          type: CellBackgroundType.ValueOpacityFill,
          color: TableCellBackgroundColor.Negative,
        },
      },
    },
    [RAQIV2Metric.FunnelUserChurnRate]: {
      columnDisplayConfigOverrides: {
        cellBackground: {
          type: CellBackgroundType.ValueOpacityFill,
          color: TableCellBackgroundColor.Negative,
        },
      },
    },
    [RAQIV2Metric.FunnelStepOverallCompletionRate]: {
      defaultTotalSummaryTypes: totalSummationSummary,

      columnDisplayConfigOverrides: {
        cellBackground: {
          type: CellBackgroundType.ValuePercentageWidthFill,
          color: TableCellBackgroundColor.Progression,
        },
        widthWeight: 40,
      },
    },
    [RAQIV2Metric.FunnelUserOverallCompletionRate]: {
      defaultTotalSummaryTypes: totalSummationSummary,

      columnDisplayConfigOverrides: {
        cellBackground: {
          type: CellBackgroundType.ValuePercentageWidthFill,
          color: TableCellBackgroundColor.Progression,
        },
        widthWeight: 40,
      },
    },
    [RAQIV2Metric.FunnelUserTotalCount]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.FunnelStepTotalCount]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },

    [RAQIV2Metric.JourneyTotalUsers]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },

    [RAQIV2Metric.JourneyCompletionUsers]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },

    [RAQIV2Metric.JourneyEntryTransitions]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },

    [RAQIV2Metric.JourneyLastStageTransitions]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },

    [RAQIV2Metric.JourneyStageUserCount]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },

    [RAQIV2Metric.JourneyStageTransitionCount]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },

    [RAQIV2Metric.JourneyNodeUserCount]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.JourneyNodeUserCount',
          TranslationNamespace.Analytics,
        ),
      },
    },

    [RAQIV2Metric.JourneyNodeUserChurnCount]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.JourneyNodeUserChurnCount',
          TranslationNamespace.Analytics,
        ),
      },
    },

    [RAQIV2Metric.JourneyNodeUserChurnRate]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.JourneyNodeUserChurnRate',
          TranslationNamespace.Analytics,
        ),
      },
    },

    [RAQIV2Metric.JourneyNodeTransitionCount]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.JourneyNodeTransitionCount',
          TranslationNamespace.Analytics,
        ),
      },
    },

    [RAQIV2Metric.JourneyNodeTransitionChurnCount]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.JourneyNodeTransitionChurnCount',
          TranslationNamespace.Analytics,
        ),
      },
    },

    [RAQIV2Metric.JourneyNodeTransitionChurnRate]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.JourneyNodeTransitionChurnRate',
          TranslationNamespace.Analytics,
        ),
      },
    },

    [RAQIV2Metric.JourneyUserPctOfSource]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.JourneyUserPctOfSource',
          TranslationNamespace.Analytics,
        ),
      },
    },

    [RAQIV2Metric.JourneyUserPctOfStart]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.JourneyUserPctOfStart',
          TranslationNamespace.Analytics,
        ),
      },
    },

    [RAQIV2Metric.JourneyTransitionPctOfSource]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.JourneyTransitionPctOfSource',
          TranslationNamespace.Analytics,
        ),
      },
    },

    [RAQIV2Metric.JourneyTransitionPctOfStart]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.JourneyTransitionPctOfStart',
          TranslationNamespace.Analytics,
        ),
      },
    },

    [RAQIV2Metric.UniqueUsersWithPlaySessions]: {
      defaultTotalSummaryTypes: [
        { type: RAQIV2SummaryType.Average },
        { type: RAQIV2SummaryType.Total },
      ],
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.UsersWithPlays', TranslationNamespace.Analytics),
      },
    },
    [RAQIV2Metric.UniqueUsersWithImpressions]: {
      defaultTotalSummaryTypes: [
        { type: RAQIV2SummaryType.Average },
        { type: RAQIV2SummaryType.Total },
      ],

      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Title.Table.UsersWithImpressions',
          TranslationNamespace.Analytics,
        ),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.UsersWithImpressions'),
      },
    },
    [RAQIV2Metric.EndToEndCVR]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.ConversionRate', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.ConversionRate'),
      },
    },
    [RAQIV2Metric.QualifiedUniqueUsersWithPlaySessions]: {
      defaultTotalSummaryTypes: [
        { type: RAQIV2SummaryType.Average },
        { type: RAQIV2SummaryType.Total },
      ],

      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Title.Table.QualifiedUsersWithPlays',
          TranslationNamespace.Analytics,
        ),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.QualifiedUsersWithPlays'),
      },
    },
    [RAQIV2Metric.QualifiedEndToEndCVR]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.QualifiedPTR', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.QualifiedPTR'),
      },
    },

    [RAQIV2Metric.UniqueUsersWithPlaySessionsMigration]: {
      defaultTotalSummaryTypes: [
        { type: RAQIV2SummaryType.Average },
        { type: RAQIV2SummaryType.Total },
      ],
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.UsersWithPlays', TranslationNamespace.Analytics),
      },
    },
    [RAQIV2Metric.UniqueUsersWithImpressionsMigration]: {
      defaultTotalSummaryTypes: [
        { type: RAQIV2SummaryType.Average },
        { type: RAQIV2SummaryType.Total },
      ],

      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Title.Table.UsersWithImpressions',
          TranslationNamespace.Analytics,
        ),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.UsersWithImpressions'),
      },
    },
    [RAQIV2Metric.EndToEndCVRMigration]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.ConversionRate', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.ConversionRate'),
      },
    },
    [RAQIV2Metric.ErrorCount]: {
      columnDisplayConfigOverrides: {
        columnAlignment: 'left',
      },
    },
    [RAQIV2Metric.QualifiedUniqueUsersWithPlaySessionsMigration]: {
      defaultTotalSummaryTypes: [
        { type: RAQIV2SummaryType.Average },
        { type: RAQIV2SummaryType.Total },
      ],

      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Title.Table.QualifiedUsersWithPlays',
          TranslationNamespace.Analytics,
        ),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.QualifiedUsersWithPlays'),
      },
    },
    [RAQIV2Metric.QualifiedEndToEndCVRMigration]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.QualifiedPTR', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.QualifiedPTR'),
      },
    },

    [RAQIV2Metric.ComputeEfficiency]: {
      dataPointTransformerType: NumericDataPointTransformerType.ScaleBackBy100,
    },

    // Attribution Table
    [RAQIV2Metric.Attribution1DPayerConversionRatio]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.PayerConversion1D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.PayerConversion1D'),
      },
    },
    [RAQIV2Metric.Attribution1DPlaytimePerUserInMinutes]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.PlaytimePerUser1D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.PlaytimePerUser1D'),
      },
    },
    [RAQIV2Metric.Attribution1DRobuxPerUser]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.RevenuePerUser1D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.RevenuePerUser1D'),
      },
    },
    [RAQIV2Metric.Attribution30DPayerConversionRatio]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.PayerConversion30D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.PayerConversion30D'),
      },
    },
    [RAQIV2Metric.Attribution30DPlaytimePerUserInMinutes]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.PlaytimePerUser30D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.PlaytimePerUser30D'),
      },
    },
    [RAQIV2Metric.Attribution30DRobuxPerUser]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.RevenuePerUser30D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.RevenuePerUser30D'),
      },
    },
    [RAQIV2Metric.Attribution7DPayerConversionRatio]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.PayerConversion7D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.PayerConversion7D'),
      },
    },
    [RAQIV2Metric.Attribution7DPlaytimePerUserInMinutes]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.PlaytimePerUser7D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.PlaytimePerUser7D'),
      },
    },
    [RAQIV2Metric.Attribution7DRobuxPerUser]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.RevenuePerUser7D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.RevenuePerUser7D'),
      },
    },
    [RAQIV2Metric.AttributionD1RetentionRatio]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.D1Retention', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.D1Retention'),
      },
    },
    [RAQIV2Metric.AttributionD30RetentionRatio]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.D30Retention', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.D30Retention'),
      },
    },
    [RAQIV2Metric.AttributionD7RetentionRatio]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.D7Retention', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.D7Retention'),
      },
    },
    [RAQIV2Metric.UniqueUsersWithClicks]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Title.Table.UsersWithDetailPageVisits',
          TranslationNamespace.Analytics,
        ),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.UsersWithDetailPageVisits'),
      },
    },
    [RAQIV2Metric.ImpressionCVR]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.UsersImpressionCTR', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.UsersImpressionCTR'),
      },
    },
    [RAQIV2Metric.ClickCVR]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.UsersDetailPageCTR', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.UsersDetailPageCTR'),
      },
    },

    [RAQIV2Metric.Attribution1DPayerConversionRatioMigration]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.PayerConversion1D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.PayerConversion1D'),
      },
    },
    [RAQIV2Metric.Attribution1DPlaytimePerUserInMinutesMigration]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.PlaytimePerUser1D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.PlaytimePerUser1D'),
      },
    },
    [RAQIV2Metric.Attribution1DRobuxPerUserMigration]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.RevenuePerUser1D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.RevenuePerUser1D'),
      },
    },
    [RAQIV2Metric.Attribution30DPayerConversionRatioMigration]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.PayerConversion30D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.PayerConversion30D'),
      },
    },
    [RAQIV2Metric.Attribution30DPlaytimePerUserInMinutesMigration]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.PlaytimePerUser30D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.PlaytimePerUser30D'),
      },
    },
    [RAQIV2Metric.Attribution30DRobuxPerUserMigration]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.RevenuePerUser30D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.RevenuePerUser30D'),
      },
    },
    [RAQIV2Metric.Attribution7DPayerConversionRatioMigration]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.PayerConversion7D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.PayerConversion7D'),
      },
    },
    [RAQIV2Metric.Attribution7DPlaytimePerUserInMinutesMigration]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.PlaytimePerUser7D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.PlaytimePerUser7D'),
      },
    },
    [RAQIV2Metric.Attribution7DRobuxPerUserMigration]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.RevenuePerUser7D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.RevenuePerUser7D'),
      },
    },
    [RAQIV2Metric.AttributionD1RetentionRatioMigration]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.D1Retention', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.D1Retention'),
      },
    },
    [RAQIV2Metric.AttributionD30RetentionRatioMigration]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.D30Retention', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.D30Retention'),
      },
    },
    [RAQIV2Metric.AttributionD7RetentionRatioMigration]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.D7Retention', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.D7Retention'),
      },
    },
    [RAQIV2Metric.UniqueUsersWithClicksMigration]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Title.Table.UsersWithDetailPageVisits',
          TranslationNamespace.Analytics,
        ),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.UsersWithDetailPageVisits'),
      },
    },
    [RAQIV2Metric.ImpressionCVRMigration]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.UsersImpressionCTR', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.UsersImpressionCTR'),
      },
    },
    [RAQIV2Metric.ClickCVRMigration]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.UsersDetailPageCTR', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.UsersDetailPageCTR'),
      },
    },
    [RAQIV2Metric.DailyRevenue]: {
      defaultTotalSummaryTypes: [
        { type: RAQIV2SummaryType.Average },
        { type: RAQIV2SummaryType.Total },
      ],

      loggingMetricOverride: 'Robux',
    },
    [RAQIV2Metric.L7AverageDailyRevenue]: {
      defaultTotalSummaryTypes: [
        { type: RAQIV2SummaryType.Average },
        { type: RAQIV2SummaryType.Total },
      ],
      loggingMetricOverride: 'Robux',
    },
    [RAQIV2Metric.ItemMonetizationRevenue]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.ItemMonetizationSales]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.AverageSessionLengthMinutes]: {
      loggingMetricOverride: 'AveragePlayTime',
    },
    [RAQIV2Metric.AveragePlayTimeMinutesPerDAU]: {
      loggingMetricOverride: 'AveragePlayTime',
    },
    [RAQIV2Metric.ThumbnailImpressions]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.ThumbnailQualifiedPlays]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.TotalSessionsEndedInBucket]: {
      defaultTotalSummaryTypes: [
        {
          type: RAQIV2SummaryType.SinglePoint,
          selectedXValue: 300,
          specificLabel: {
            translationKey: translationKey(
              'Label.PercentageInSummary',
              TranslationNamespace.Analytics,
            ),
            arguments: {
              minute: Math.floor(300 / 60).toString(),
            },
          },
        },
      ],

      dataPointTransformerType: NumericDataPointTransformerType.PercentageOfFirstPoint,
      exploreModeChartType: ChartType.DurationSpline,
      exploreModeSpecOverride: {
        breakdown: {
          intersect: [RAQIV2Dimension.SessionTimeBucket],
        },
        granularity: {
          override: RAQIV2MetricGranularity.None,
        },
      },
      totalSeriesNameOverride: translationKey(
        'Label.PlayersPercentage',
        TranslationNamespace.Analytics,
      ),
    },

    // UI Metrics
    [RAQIV2UIMetric.ClientMemoryUsage]: {
      dataPointTransformerType: NumericDataPointTransformerType.ScaleBackBy1000000000,
    },
    [RAQIV2UIMetric.SessionDurationSeconds]: {
      dataPointTransformerType: NumericDataPointTransformerType.ScaleBackBy60,
    },
    [RAQIV2UIMetric.ServerMemoryUsage]: {
      dataPointTransformerType: NumericDataPointTransformerType.ScaleBackBy1000000000,
    },
    [RAQIV2UIMetric.ServerCpuTime]: {
      exploreModeChartType: ChartType.Area,
    },
    [RAQIV2UIMetric.ServerMemoryUsageV2]: {
      exploreModeChartType: ChartType.Area,
    },
    [RAQIV2Metric.ClientCpuTimeAvg]: {
      exploreModeChartType: ChartType.Area,
    },
    [RAQIV2UIMetric.ServerMemoryUsageByServerAge]: {
      exploreModeChartType: ChartType.DurationArea,
      exploreModeSpecOverride: {
        granularity: {
          override: RAQIV2MetricGranularity.None,
        },
        breakdown: {
          intersect: [RAQIV2Dimension.ServerAgeBucket],
        },
      },
    },
    [RAQIV2Metric.ItemAvatar3dLimitedAvailableQuantity]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.ItemAvatar3dLimitedTotalQuantity]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.ItemLifetimeCreatorEarning]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.ItemLifetimeRebateAmount]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.ItemLifetimeRobuxSpent]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.ItemLifetimeTransactionCount]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.ItemLimitedSoldPercentage]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.ItemPublishAdvance]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.ItemTotalCreatorEarning]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Label.Revenue', TranslationNamespace.AvatarAnalytics),
      },
    },
    [RAQIV2Metric.ItemTotalRobuxSpent]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.ItemTotalTransactionCount]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Title.Table.ItemTotalTransactionCount',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.StoreTransactions]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.StoreRevenue]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },

    [RAQIV2Metric.ShareLinkAttribution1DPayerConversionRatio]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.ShareLinkAttribution1DPlaytimePerUserInMinutes]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.ShareLinkAttribution1DRobuxPerUser]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.ShareLinkAttribution30DPayerConversionRatio]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.PayerConversion30D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.PayerConversion30D'),
      },
    },
    [RAQIV2Metric.ShareLinkAttribution30DPlaytimePerUserInMinutes]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.ShareLinkAttribution30DRobuxPerUser]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.RevenuePerUser30D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.RevenuePerUser30D'),
      },
    },
    [RAQIV2Metric.ShareLinkAttribution7DPayerConversionRatio]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.ShareLinkAttribution7DPlaytimePerUserInMinutes]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Title.Table.PlaytimePerUser7D', TranslationNamespace.Analytics),
        tooltipKey: translationKeyWithoutNamespace('Description.Table.PlaytimePerUser7D'),
      },
    },
    [RAQIV2Metric.ShareLinkAttribution7DRobuxPerUser]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.ShareLinkAttributionD1RetentionRatio]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.ShareLinkAttributionD30RetentionRatio]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.ShareLinkAttributionD7RetentionRatio]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      columnDisplayConfigOverrides: {
        tooltipKey: translationKeyWithoutNamespace('Description.Table.D7Retention'),
      },
    },
    [RAQIV2Metric.ShareLinkQualifiedClickCVR]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKeyWithoutNamespace('Description.Table.UsersDetailPageCTR'),
      },
    },
    [RAQIV2Metric.ShareLinkQualifiedUniqueUsersWithPlaySessions]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      columnDisplayConfigOverrides: {
        tooltipKey: translationKeyWithoutNamespace('Description.Table.QualifiedUsersWithPlays'),
      },
    },
    [RAQIV2Metric.ShareLinkUniqueUsersWithClicks]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      columnDisplayConfigOverrides: {
        tooltipKey: translationKeyWithoutNamespace('Description.Table.UsersWithDetailPageVisits'),
      },
    },
    [RAQIV2Metric.ShareLinkUniqueUsersWithPlaySessions]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },

    [RAQIV2Metric.AffiliateLinkDailyAverageRobuxBookingsPerReactivationSpender]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.AverageRobuxBookingsPerReactivationSpenderV3',
          TranslationNamespace.Analytics,
        ),
        titleKey: translationKey(
          'Label.Metric.AverageRobuxBookingsPerReactivationSpenderV3',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.AffiliateLinkDailyAffiliateActiveSpenderReactivationsPayoutRobux]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.LifetimeEstimatedAffiliateActiveSpenderReactivationsPayoutRobuxV3',
          TranslationNamespace.Analytics,
        ),
        titleKey: translationKey(
          'Label.Metric.LifetimeEstimatedAffiliateActiveSpenderReactivationsPayoutRobuxV3',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.AffiliateLinkDailyQualifiedActiveSpenderReactivations]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.LifetimeQualifiedActiveSpenderReactivationsV3',
          TranslationNamespace.Analytics,
        ),
        titleKey: translationKey(
          'Label.Metric.LifetimeQualifiedActiveSpenderReactivationsV3',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.AffiliateLinkDailyQualifiedReactivationsSpenders]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.LifetimeQualifiedReactivationsSpendersV3',
          TranslationNamespace.Analytics,
        ),
        titleKey: translationKey(
          'Label.Metric.LifetimeQualifiedReactivationsSpendersV3',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.AffiliateLinkDailyAffiliateReactivationsPayoutRobux]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.LifetimeEstimatedAffiliateReactivationsPayoutRobuxV3',
          TranslationNamespace.Analytics,
        ),
        titleKey: translationKey(
          'Label.Metric.LifetimeEstimatedAffiliateReactivationsPayoutRobuxV3',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.AffiliateLinkDailyQualifiedSignupSpenders]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.LifetimeQualifiedSignupSpendersV3',
          TranslationNamespace.Analytics,
        ),
        titleKey: translationKey(
          'Label.Metric.LifetimeQualifiedSignupSpendersV3',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.AffiliateLinkDailyAverageRobuxBookingsPerSignupSpender]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.AverageRobuxBookingsPerSignupSpenderV3',
          TranslationNamespace.Analytics,
        ),
        titleKey: translationKey(
          'Label.Metric.AverageRobuxBookingsPerSignupSpenderV3',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.AffiliateLinkDailyAffiliateSignupsPayoutRobux]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.LifetimeEstimatedAffiliateSignupsPayoutRobuxV3',
          TranslationNamespace.Analytics,
        ),
        titleKey: translationKey(
          'Label.Metric.LifetimeEstimatedAffiliateSignupsPayoutRobuxV3',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.AffiliateLinkDailyBookingsPerSpenderCombined]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.BookingsPerSpenderCombinedV3',
          TranslationNamespace.Analytics,
        ),
        titleKey: translationKey(
          'Label.Metric.BookingsPerSpenderCombinedV3',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.AffiliateLinkDailyVisits]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.Metric.AffiliateLinkDailyVisits',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.AffiliateLinkDailyQualifiedSignups]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.LifetimeQualifiedSignupsV3',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.AffiliateLinkDailyQualifiedReactivations]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.LifetimeQualifiedReactivationsV3',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.AffiliateLinkDailyTotalPayoutRobux]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey(
          'Description.LifetimeEstimatedAffiliateCombinedPayoutRobuxV3',
          TranslationNamespace.Analytics,
        ),
        titleKey: translationKey(
          'Label.Metric.LifetimeEstimatedAffiliateCombinedPayoutRobuxV3',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelSignups]: {
      columnDisplayConfigOverrides: {
        tooltipKey: translationKey('Description.Metric.AESignups', TranslationNamespace.Analytics),
      },
    },
    [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelReactivations]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.LifetimeQualifiedReactivationsV3',
          TranslationNamespace.Analytics,
        ),
        tooltipKey: translationKey(
          'Description.Metric.AEReactivations',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelPercentOfNewUsers]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.AEAudienceExpansionPercentage',
          TranslationNamespace.Analytics,
        ),
        tooltipKey: translationKey(
          'Description.Metric.AEAudienceExpansionPercentage',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRetentionD1]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Label.Metric.AERetentionD1', TranslationNamespace.Analytics),
        tooltipKey: translationKey(
          'Description.Metric.AERetentionD1',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRetentionD7]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Label.Metric.AERetentionD7', TranslationNamespace.Analytics),
        tooltipKey: translationKey(
          'Description.Metric.AERetentionD7',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelPayerConversion7D]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.AEPayerConversion7D',
          TranslationNamespace.Analytics,
        ),
        tooltipKey: translationKey(
          'Description.Metric.AEPayerConversion7D',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRevenuePerPayer7D]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.AERevenuePerPayer7D',
          TranslationNamespace.Analytics,
        ),
        tooltipKey: translationKey(
          'Description.Metric.AERevenuePerPayer7D',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRevenuePerUser7D]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey('Label.Metric.AERevenuePerUser7D', TranslationNamespace.Analytics),
        tooltipKey: translationKey(
          'Description.Metric.AERevenuePerUser7D',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelPayerConversion60D]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.AEPayerConversion60D',
          TranslationNamespace.Analytics,
        ),
        tooltipKey: translationKey(
          'Label.Description.AEPayerConversion60D',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRevenuePerPayer60D]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.AERevenuePerPayer60D',
          TranslationNamespace.Analytics,
        ),
        tooltipKey: translationKey(
          'Label.Description.AERevenuePerPayer60D',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRevenuePerUser60D]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.AERevenuePerUser60D',
          TranslationNamespace.Analytics,
        ),
        tooltipKey: translationKey(
          'Label.Description.AERevenuePerUser60D',
          TranslationNamespace.Analytics,
        ),
      },
    },
    [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelEstimatedPayout]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.CreatorRewardsLifetimeEstimatedAffiliatePayoutRobux',
          TranslationNamespace.Analytics,
        ),
        tooltipKey: translationKey(
          'Label.Description.AERevenuePerPayer60D',
          TranslationNamespace.Analytics,
        ),
      },
    },

    // NOTE(shumingxu, 2025-01-09): Below are all placeholders for the metrics that are not yet implemented.
    // Please update before using them.
    [RAQIV2Metric.FriendReferralAverageRobuxBookingsPerSpender]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.FriendReferralLifetimeEstimatedAffiliatePayoutRobux]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.FriendReferralLifetimeQualifiedSignups]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.FriendReferralLifetimeQualifiedSpenders]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.FriendReferralLifetimeVisits]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.PlayerFeedbackVotesCount]: {
      defaultTotalSummaryTypes: [],

      exploreModeChartType: ChartType.Column,
    },
    [RAQIV2UIMetric.MatchmakingCategoricalCustomSignalsSimilarityRatio]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.MatchmakingCategoricalCustomSignalsSimilarityRatio',
          TranslationNamespace.Matchmaking,
        ),
        tooltipKey: translationKey(
          'Description.MatchmakingCategoricalCustomSignalsSimilarityRatio',
          TranslationNamespace.Matchmaking,
        ),
      },
    },
    [RAQIV2UIMetric.MatchmakingNumericCustomSignalsDifference]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.MatchmakingNumericCustomSignalsDifference',
          TranslationNamespace.Matchmaking,
        ),
        tooltipKey: translationKey(
          'Description.MatchmakingNumericCustomSignalsDifference',
          TranslationNamespace.Matchmaking,
        ),
      },
    },
    [RAQIV2Metric.MatchmakingPlayerAttributesLoadingStatusAvg]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.MatchmakingPlayerAttributesLoadingStatusAvg',
          TranslationNamespace.Matchmaking,
        ),
        tooltipKey: translationKey(
          'Description.MatchmakingPlayerAttributesLoadingStatusAvg',
          TranslationNamespace.Matchmaking,
        ),
      },
    },
    [RAQIV2UIMetric.MatchmakingSignalsAgeDifference]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.MatchmakingSignalsAgeDifference',
          TranslationNamespace.Matchmaking,
        ),
        tooltipKey: translationKey(
          'Description.MatchmakingSignalsAgeDifference',
          TranslationNamespace.Matchmaking,
        ),
      },
    },
    [RAQIV2UIMetric.MatchmakingSignalsCommonChatGroupRatio]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.MatchmakingSignalsCommonChatGroupRatio',
          TranslationNamespace.Matchmaking,
        ),
        tooltipKey: translationKey(
          'Description.MatchmakingSignalsCommonChatGroupRatio',
          TranslationNamespace.Matchmaking,
        ),
      },
    },
    [RAQIV2UIMetric.MatchmakingSignalsCommonDeviceTypeRatio]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.MatchmakingSignalsCommonDeviceTypeRatio',
          TranslationNamespace.Matchmaking,
        ),
        tooltipKey: translationKey(
          'Description.MatchmakingSignalsCommonDeviceTypeRatio',
          TranslationNamespace.Matchmaking,
        ),
      },
    },
    [RAQIV2UIMetric.MatchmakingSignalsCommonLanguageRatio]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.MatchmakingSignalsCommonLanguageRatio',
          TranslationNamespace.Matchmaking,
        ),
        tooltipKey: translationKey(
          'Description.MatchmakingSignalsCommonLanguageRatio',
          TranslationNamespace.Matchmaking,
        ),
      },
    },
    [RAQIV2UIMetric.MatchmakingSignalsEstimatePing]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.MatchmakingSignalsEstimatedPing',
          TranslationNamespace.Matchmaking,
        ),
        tooltipKey: translationKey(
          'Description.MatchmakingSignalsEstimatedPing',
          TranslationNamespace.Matchmaking,
        ),
      },
    },
    [RAQIV2UIMetric.MatchmakingSignalsOccupancyRatio]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.MatchmakingSignalsOccupancyRatio',
          TranslationNamespace.Matchmaking,
        ),
        tooltipKey: translationKey(
          'Description.MatchmakingSignalsOccupancyRatio',
          TranslationNamespace.Matchmaking,
        ),
      },
    },
    [RAQIV2UIMetric.MatchmakingSignalsPlayHistoryDifference]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.MatchmakingSignalsPlayHistoryDifference',
          TranslationNamespace.Matchmaking,
        ),
        tooltipKey: translationKey(
          'Description.MatchmakingSignalsPlayHistoryDifference',
          TranslationNamespace.Matchmaking,
        ),
      },
    },
    [RAQIV2Metric.MatchmakingSignalsPreferredPlayerMatchRatioAvg]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.MatchmakingSignalsFriendsMatchRatioAvg',
          TranslationNamespace.Matchmaking,
        ),
        tooltipKey: translationKey(
          'Description.MatchmakingSignalsFriendsMatchRatioAvg',
          TranslationNamespace.Matchmaking,
        ),
      },
    },
    [RAQIV2UIMetric.MatchmakingSignalsVoiceChatRatio]: {
      columnDisplayConfigOverrides: {
        titleKey: translationKey(
          'Label.Metric.MatchmakingSignalsVoiceChatRatio',
          TranslationNamespace.Matchmaking,
        ),
        tooltipKey: translationKey(
          'Description.MatchmakingSignalsVoiceChatRatio',
          TranslationNamespace.Matchmaking,
        ),
      },
    },
    [RAQIV2Metric.DataStoreListRequests]: {
      defaultTotalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
      exploreModeChartType: ChartType.Spline,
    },
    [RAQIV2Metric.DataStoreReadRequestsQuotaStandard]: {
      defaultTotalSummaryTypes: [],
    },
    [RAQIV2Metric.DataStoreWriteRequestsQuotaOrdered]: {
      defaultTotalSummaryTypes: [],
    },
    [RAQIV2Metric.DataStoreStorageQuotaBytes]: {
      defaultTotalSummaryTypes: [],
    },
    [RAQIV2Metric.DataStoreStorageUsageBytes]: {
      defaultTotalSummaryTypes: [],
      exploreModeChartType: ChartType.Spline,
    },
    [RAQIV2Metric.DataStoreWriteRequests]: {
      defaultTotalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
      exploreModeChartType: ChartType.Spline,
    },
    [RAQIV2Metric.DataStoreRequestsByStatus]: {
      exploreModeChartType: ChartType.Spline,
    },
    [RAQIV2Metric.DataStoreRequestsByEndpoint]: {
      exploreModeChartType: ChartType.Spline,
    },
    [RAQIV2Metric.DataStoreRemoveRequests]: {
      defaultTotalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
      exploreModeChartType: ChartType.Spline,
    },
    [RAQIV2Metric.DataStoreRemoveRequestsQuotaStandard]: {
      defaultTotalSummaryTypes: [],
    },
    [RAQIV2Metric.DataStoreRemoveRequestsQuotaOrdered]: {
      defaultTotalSummaryTypes: [],
    },
    [RAQIV2Metric.DataStoreReadRequestsQuotaOrdered]: {
      defaultTotalSummaryTypes: [],
    },
    [RAQIV2Metric.DataStoreWriteRequestsQuotaStandard]: {
      defaultTotalSummaryTypes: [],
    },
    [RAQIV2Metric.DataStoreListRequestsQuotaStandard]: {
      defaultTotalSummaryTypes: [],
    },
    [RAQIV2Metric.DataStoreListRequestsQuotaOrdered]: {
      defaultTotalSummaryTypes: [],
    },
    [RAQIV2Metric.DataStoreListRequestsQuota]: {
      defaultTotalSummaryTypes: [],
    },
    [RAQIV2Metric.DataStoreReadRequests]: {
      exploreModeChartType: ChartType.Spline,
      defaultTotalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    },
    [RAQIV2Metric.DataStoreConsumedReadRequests]: {
      defaultTotalSummaryTypes: [{ type: RAQIV2SummaryType.QuotaPercentageUsage }],
      exploreModeChartType: ChartType.Spline,
    },
    [RAQIV2Metric.DataStoreConsumedWriteRequests]: {
      defaultTotalSummaryTypes: [{ type: RAQIV2SummaryType.QuotaPercentageUsage }],
      exploreModeChartType: ChartType.Spline,
    },
    [RAQIV2Metric.DataStoreConsumedListRequests]: {
      defaultTotalSummaryTypes: [{ type: RAQIV2SummaryType.QuotaPercentageUsage }],
      exploreModeChartType: ChartType.Spline,
    },
    [RAQIV2Metric.DataStoreConsumedRemoveRequests]: {
      defaultTotalSummaryTypes: [{ type: RAQIV2SummaryType.QuotaPercentageUsage }],
      exploreModeChartType: ChartType.Spline,
    },
    [RAQIV2Metric.CommerceGMV]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.CommerceQuantitySold]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.CommerceClicks]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.CommerceImpressions]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.CommerceOrders]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.CommerceCheckouts]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.CommerceUniqueClicks]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.CommerceUniqueImpressions]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.CommerceUniqueCheckouts]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.CommerceUniqueOrders]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.AdsPublisherReportingTotalRevenueRobux]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.AdsPublisherReportingTotalImpressions]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.AdsPublisherReportingVideo2DRevenueRobux]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.AdsPublisherReportingVideo2DImpressions]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.AdsPublisherReportingVideo2DDailyUniqueViewer]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.CommunityGroupPageViews]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.CommunityGroupPageUniqueVisitors]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.CommunityMembershipChangeEvents]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.CommunityForumContentEventCount]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.CommunityForumContentUniqueUsers]: {
      defaultTotalSummaryTypes: totalSummationSummary,
    },
    [RAQIV2Metric.CommunityMembershipCount]: {
      defaultTotalSummaryTypes: lastValueSummary,
    },
    // Video service playback is ingested in seconds but displayed in hours on
    // the Video Service dashboard. Rescale the raw seconds to hours (the
    // matching unit/precision is applied via RAQIV2MetricUnitDisplayOverride).
    [RAQIV2Metric.VideoServiceExclusivePlaybackSeconds]: {
      defaultTotalSummaryTypes: totalSummationSummary,
      dataPointTransformerType: NumericDataPointTransformerType.ScaleBackBy3600,
    },
  };

const RAQIV2NonNumericMetricDisplayConfig: Partial<
  Record<TRAQIV2Metric, NonNumericMetricDisplayConfig>
> = {
  [RAQIV2Metric.ThumbnailWinningSegments]: {
    rendererType: RAQIV2MetricValueRendererType.WinningSegments,
    valueTranslationKeys: {
      // TODO(tyin): remove every strings other than below_18 and above_or_equal_18
      male_below_13: {
        name: translationKey('Label.WinningSegment.MaleBelow13', TranslationNamespace.Analytics),
      },
      female_below_13: {
        name: translationKey('Label.WinningSegment.FemaleBelow13', TranslationNamespace.Analytics),
      },
      male_above_13: {
        name: translationKey('Label.WinningSegment.MaleAbove13', TranslationNamespace.Analytics),
      },
      female_above_13: {
        name: translationKey('Label.WinningSegment.FemaleAbove13', TranslationNamespace.Analytics),
      },
      below_18: {
        name: translationKey('Label.WinningSegment.Below18', TranslationNamespace.Analytics),
      },
      above_or_equal_18: {
        name: translationKey('Label.WinningSegment.AboveOrEqual18', TranslationNamespace.Analytics),
      },
    },
  },
};

type StronglyTypedNonNumericMetricDisplayConfig = NonNumericMetricDisplayConfig & {
  valueType: RAQIV2MetricValueType.String | RAQIV2MetricValueType.StringArray;
};
type StronglyTypedNumericMetricDisplayConfig = NumericMetricDisplayConfig & {
  valueType: RAQIV2MetricValueType.Numeric;
};

type MetricDisplayConfig = TRAQIV2MetricDisplayConfig &
  (StronglyTypedNonNumericMetricDisplayConfig | StronglyTypedNumericMetricDisplayConfig);

const getMetricDisplayConfig = (metric: TRAQIV2Metric): MetricDisplayConfig => {
  const metricConfig = RAQIV2MetricDisplayConfig[metric];

  const frontendOverride =
    metricConfig.valueType === RAQIV2MetricValueType.Numeric
      ? RAQIV2NumericMetricDisplayConfig[metric]
      : RAQIV2NonNumericMetricDisplayConfig[metric];

  const result: MetricDisplayConfig = {
    ...defaultBaseMetricDisplayConfig,
    ...metricConfig,
    ...frontendOverride,
  };

  // Apply unit/precision overrides after the merge so they don't widen the
  // merged config's required `unit`/`decimalPrecision` to include `undefined`.
  const unitOverride = RAQIV2MetricUnitDisplayOverride[metric];
  if (unitOverride != null) {
    result.unit = unitOverride.unit;
    result.decimalPrecision = unitOverride.decimalPrecision;
  }

  return result;
};

export default getMetricDisplayConfig;
