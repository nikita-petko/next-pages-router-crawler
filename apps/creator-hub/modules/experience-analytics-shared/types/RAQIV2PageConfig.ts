import React from 'react';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import type {
  RAQIV2Dimension,
  TRAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import type { TranslationKey } from '@modules/analytics-translations/types';
import type { AnalyticsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import type SingleDateType from '@modules/charts-generic/enums/SingleDateType';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import type {
  ChartResourceType as RAQIV2ChartResourceType,
  TQueryFilter as RAQIV2QueryFilter,
} from '@modules/clients/analytics/analyticsRAQIShared';
import type { AnnotationType } from '@modules/clients/analytics/annotations/annotations';
import type { ArbitraryComponentConfig } from '../components/RAQIV2/layout/AnalyticsArbitraryComponent';
import type { AnalyticsControlledSubcontextConfig } from '../components/RAQIV2/subcontext/RAQIV2ControlledSubcontextConfig';
import type { OnboardingTipsConfigs } from '../constants/onboardingTipsConfigs';
import type { ChartConfigOrPredefinedKey } from '../constants/RAQIV2PredefinedChartConfig';
import type { AnalyticsSummaryCardConfig } from '../constants/RAQIV2PredefinedSummaryCardConfig';
import type { TabbedChartConfigOrPredefinedKey } from '../constants/RAQIV2PredefinedTabbedChartConfig';
import type { AnalyticsTabbedTableConfig } from '../constants/RAQIV2PredefinedTabbedTableConfigs';
import type { AnalyticsTableConfig } from '../constants/RAQIV2PredefinedTableConfig';
import type { SpecOverride } from '../utils/computeRAQIV2SpecOverride';
import type { FilterPositionOverrides } from '../utils/filterPositionOnPageByDimension';
import type { TUIGranularity } from '../utils/seriesGranularities';
import type TDateRangeSelection from './DateRangeSelection';
import type { ChartConfig } from './RAQIV2ChartConfig';
import type RAQIV2EligibilityChecker from './RAQIV2EligibilityChecker';
import type { RAQIV2SpecialLayoutConfig } from './RAQIV2SpecialLayoutConfig';
import type { TabbedChartConfig } from './RAQIV2TabbedChartConfig';

export type AnalyticsComponentConfigLiteral = ChartConfig | TabbedChartConfig;
export type AnalyticsComponentConfig =
  | ChartConfigOrPredefinedKey
  | TabbedChartConfigOrPredefinedKey
  | AnalyticsControlledSubcontextConfig
  | AnalyticsTableConfig
  | AnalyticsTabbedTableConfig
  | AnalyticsSummaryCardConfig
  | ArbitraryComponentConfig;

export type RAQIV2UIComponent =
  | AnalyticsComponentConfig
  | RAQIV2SpecialLayoutConfig<AnalyticsComponentConfig>;

export type CreatorAnalyticsPageSurfaceViewSelectorRenderProps = {
  selectedViewKey: string;
  onSelectViewKey: (viewKey: string) => void;
};

export type CreatorAnalyticsPageSurfaceViewSelectorConfig = {
  defaultViewKey: string;
  renderViewSelector: (
    props: CreatorAnalyticsPageSurfaceViewSelectorRenderProps,
  ) => React.ReactNode;
  getBodyForView: (viewKey: string) => RAQIV2UIComponent[];
};

/** We limit the options here because they are sometimes rendered without a real chart context. */
export type RAQIV2PreControlComponent =
  | ArbitraryComponentConfig
  | RAQIV2SpecialLayoutConfig<ArbitraryComponentConfig>;

/**
 * Matches when the duration of the selected date range (`endDate - startDate`)
 * falls within the closed window `[minDurationMs, maxDurationMs]` (both bounds
 * inclusive). Either bound may be omitted to leave that side open.
 *
 * This is the default variant (`type` may be omitted) and mirrors the
 * developer-analytics `granularity_constraints` proto shape so codegen can
 * later populate this field directly.
 *
 * Use it when "how long the range spans" is the criterion that decides whether
 * a granularity is sensible at the chosen range size.
 *
 * Example: messaging service allows `OneMinute` only when the range is at most
 * one day long (`Last 1 Hour`, `Last 1 Day`, or any custom range up to 24h),
 * to keep the chart point count manageable.
 *
 * ```ts
 * granularity: {
 *   options: [OneMinute, HalfHour, OneHour, OneDay],
 *   constraints: {
 *     [OneMinute]: [{ type: 'duration', maxDurationMs: 24 * 60 * 60 * 1000 }],
 *   },
 * }
 * ```
 *
 * Example: deny a granularity unconditionally with an empty rule list (the
 * replacement for the legacy `NOT_ALLOWED`):
 *
 * ```ts
 * constraints: { [OneMinute]: [] }
 * ```
 */
export type GranularityDurationConstraintRule = {
  type?: 'duration';
  minDurationMs?: number;
  maxDurationMs?: number;
};

/**
 * Matches when the range's `startDate` falls within the most-recent
 * `startWithinDays` full days, day-snapped against `endDate`.
 *
 * This variant is page-only (it has no proto counterpart). Use it when "how
 * fresh the start of the range is" is the criterion — typically because the
 * backend only retains fine-grained data for a recent retention window, and
 * the metric remains queryable at a coarser granularity for older data.
 *
 * Example: matchmaking allows `OneHour` only when the range starts within the
 * most-recent 7 full days. For older starts no rule matches, so `OneHour` is
 * hidden (`OneDay`, absent from `constraints`, stays governed by the matrix):
 *
 * ```ts
 * granularity: {
 *   options: [OneHour, OneDay],
 *   constraints: {
 *     [OneHour]: [{ type: 'freshness', startWithinDays: 7 }],
 *   },
 * }
 * ```
 */
export type GranularityFreshnessConstraintRule = {
  type: 'freshness';
  startWithinDays: number;
};

/**
 * A single matcher rule used to gate a granularity in `granularity.constraints`.
 *
 * A granularity listed in `constraints` is allowed iff at least one rule in
 * its list matches the current request. See each variant for matcher
 * semantics and usage examples.
 *
 * Multiple rules can be combined with OR semantics in the same list, e.g. to
 * allow `OneHour` either when the start is fresh OR when the range is short:
 *
 * ```ts
 * constraints: {
 *   [OneHour]: [
 *     { type: 'freshness', startWithinDays: 7 },
 *     { type: 'duration', maxDurationMs: 24 * 60 * 60 * 1000 },
 *   ],
 * }
 * ```
 */
export type GranularityConstraintRule =
  | GranularityDurationConstraintRule
  | GranularityFreshnessConstraintRule;

export enum EndDateBehavior {
  /**
   * Max end date is set by querying for the latest available time for the page's metrics.
   * This is done by extracting the metrics from the AnalyticsConfigurableComponents (e.g. AnalyticsConfigChart)
   * and querying CAaaS for the latest available time.
   */
  LatestAvailableForMetrics = 'LatestAvailableForMetrics',
  /**
   * Max end date is set to the current date.
   */
  CurrentTime = 'CurrentTime',
}

type DateOptions = {
  type: 'dateRange' | 'singleDay' | 'None';
} & (
  | { type: 'None' }
  | {
      type: 'dateRange';
      supportedRanges: RAQIV2DateRangeType[];
      defaultRange: RAQIV2DateRangeType;
      maxStartDateOffsetDays?: number;
      minStartDate?: Date;
      excludeEndDateInRange?: boolean;
      maxEndDateOffset?: number;
      maxRangeDays?: number; // The maximum number of days that can be selected for the date range.
    }
  | {
      type: 'singleDay';
      /**
       * Single-day picker configuration when type is 'singleDay'.
       * For dateRange or None, PageConfigAwareSingleDateProvider falls back to MostRecent-only defaults (maxEndDateOffset 2).
       */
      supportedDates: SingleDateType[];
      defaultDate: SingleDateType;
      maxEndDateOffset?: number;
    }
);
export type { DateOptions as AnalyticsPageConfigDateOptions };

export type AnalyticsPageConfigDefaultDateRangeSelection =
  | {
      readonly type: 'Preset';
      readonly rangeType: RAQIV2DateRangeType;
    }
  | {
      readonly type: 'Custom';
      readonly startTime: Date;
      readonly endTime: Date;
    };

type AnnotationOptions = {
  supportedAnnotationTypes: AnnotationType[];
  defaultAnnotationTypes: AnnotationType[];
  showAnnotationsControl: boolean;
};
export type { AnnotationOptions as AnalyticsPageConfigAnnotationOptions };

/**
 * Sentinel config for callsites that need to wrap content in AnalyticsContextLayerInnerProvider
 * but don't have page-specific analytics config. All providers will use their built-in defaults.
 */
export const defaultAnalyticsPageSurfaceConfig: CreatorAnalyticsPageSurfaceConfig = {
  resourceTypes: [],
  timeRangeOptions: {
    type: 'dateRange',
    supportedRanges: [
      RAQIV2DateRangeType.Last7Days,
      RAQIV2DateRangeType.Last28Days,
      RAQIV2DateRangeType.Last56Days,
      RAQIV2DateRangeType.Last90Days,
      RAQIV2DateRangeType.Last365Days,
      RAQIV2DateRangeType.Custom,
    ],
    defaultRange: RAQIV2DateRangeType.Last28Days,
    excludeEndDateInRange: false,
    maxEndDateOffset: 0,
    maxStartDateOffsetDays: 365,
  },
  surfaceAnnotationOptions: {
    supportedAnnotationTypes: [],
    defaultAnnotationTypes: [],
    showAnnotationsControl: false,
  },
  filterDimensions: [],
  breakdownDimensions: [],
  body: [],
};

// See ../experience-analytics-shared/docs/LAYOUT_CONFIGS.md for more information
export type CreatorAnalyticsPageSurfaceConfig = {
  resourceTypes: RAQIV2ChartResourceType[];

  // Control Bar Components:
  // Left side controls:
  timeRangeOptions: DateOptions;
  defaultDateRangeSelection?: AnalyticsPageConfigDefaultDateRangeSelection;
  surfaceAnnotationOptions: AnnotationOptions;

  filterDimensions: ReadonlyArray<TRAQIV2Dimension>;
  /**
   * Per-page overrides for which RAQIV2FilterRenderPosition each dimension
   * renders into. Entries take precedence over the global mapping in
   * `filterPositionOnPageByDimension`. Use this to relocate a dimension on a
   * single surface (e.g. moving Place/PlaceVersion to `ControlsRow2` on the
   * Error Report page) without affecting other surfaces.
   */
  filterPositionOverrides?: FilterPositionOverrides;
  // isInitialValueOnly: if true, the filter will only apply when page first load and can be modified
  defaultFilters?: (RAQIV2QueryFilter & { isInitialValueOnly?: boolean })[];

  // Right side controls:
  breakdownDimensions: ReadonlyArray<TRAQIV2Dimension>;
  defaultBreakdown?: ReadonlyArray<TRAQIV2Dimension>;

  granularity?:
    | {
        options: TUIGranularity[];
        /**
         * Per-granularity list of matcher rules. Semantics are per-granularity
         * replacement:
         *  - When a granularity is NOT present in this record, the default
         *    per-metric matrix in `getGranularityOptionsForMetric` decides
         *    availability.
         *  - When a granularity IS present, the rule list fully governs its
         *    availability (the matrix is bypassed for that granularity), with
         *    the safety check that the metric must still fundamentally support
         *    the granularity per `RAQIV2MetricToSupportedGranularities`.
         *
         * Within the rule list, the granularity is allowed iff at least one
         * rule's matchers apply to the current request. An empty array (`[]`)
         * means the granularity is always denied (the equivalent of the legacy
         * `NOT_ALLOWED`).
         *
         * Page authors gating a granularity that the matrix would normally
         * exclude are responsible for verifying that the backend can serve the
         * metric at this granularity for the declared window, and that chart
         * rendering remains acceptable at the resulting data point count.
         */
        constraints?: Partial<Record<TUIGranularity, GranularityConstraintRule[]>>;
      }
    | { fixed: RAQIV2MetricGranularity };
  defaultGranularity?: TUIGranularity;

  // Surface Body Components
  body: RAQIV2UIComponent[];
  surfaceViewSelector?: CreatorAnalyticsPageSurfaceViewSelectorConfig;

  // NOTE(shumingxu, 2024/07/02): This is not used right now but allows for tab-specific eligibility checks in the future
  eligibility?: RAQIV2PageEligibilityConfig;

  // NOTE(gperkins, 2024/08/13): We can't render most components in the pre-control section because they rely on the chart context
  preControlCharts?: RAQIV2PreControlComponent[];
  // NOTE(shumingxu, 2024/10/08): This is used to set the date range for the pre-control components
  // e.g. past 3 days for realtime monetization, past 90 days for custom event selector
  preControlComponentDateRange?: TDateRangeSelection;

  hideHeroDivider?: boolean;

  /** Optional additional banners to render after the description, alongside status banners */
  additionalBanners?: React.ReactNode;

  /**
   * Controls how the max end date is determined for the date range selector.
   * Defaults to CurrentTime if not specified.
   */
  endDateBehavior?: EndDateBehavior;
};

export type TabbedRAQIV2PageTabConfig<TTab extends string> = CreatorAnalyticsPageSurfaceConfig & {
  tabKey: TTab;
  label: TranslationKey;
  onboardingTipsConfig?: OnboardingTipsConfigs;
  action?: React.ReactElement;
  description?: RAQIV2PageDescriptionSpec;
};

export type RAQIV2PageEligibilityConfig = {
  checkerType: RAQIV2EligibilityChecker;
  ineligibleMessage: TranslationKey;
  ignorePreControlComponents: boolean;
};

export type RAQIV2PageDescriptionSpec = {
  standard: TranslationKey;
  tooltipText?: TranslationKey;
  mobile?: TranslationKey;
};

export type RAQIV2PageConfig = {
  debugPageName?: string;
  title: TranslationKey;
  description: RAQIV2PageDescriptionSpec;
  action?: React.ReactElement;
  eligibility?: RAQIV2PageEligibilityConfig;
  /** Navigation item for this page, used by tabbed layouts to auto-construct HubMeta titles. */
  navigationItem?: AnalyticsNavigationItem;

  /**
   * Temporary acquisition banner slot; remove with CLIGROW-3770 cleanup.
   * Shown only when no status banners are active.
   */
  fallbackBanner?: React.ReactNode;

  /**
   * NOTE(gperkins@20250520): To use secondary links in your page description text,
   *  use the following format for your "english" value:
   *
   * ```
   * See {linkStart}here{linkEnd} for the first link
   * and {linkStart1}here{linkEnd1} for the second link, etc.
   * ```
   */
  docLinks: AnalyticsDocLink[]; // Previously an enum, now moved to per-module constants
};

// For pages with fixed-tabs (e.g. performance, maybe monetization/items)
// See ../experience-analytics-shared/docs/LAYOUT_CONFIGS.md for more information
export type CreatorAnalyticsFixedTabPageConfig<TTab extends string> = RAQIV2PageConfig & {
  mode: CreatorAnalyticsPageMode.FixedTab;
  tabOrder: Readonly<TTab[]>;
  tabs: Record<TTab, TabbedRAQIV2PageTabConfig<TTab>>;
};

// See ../experience-analytics-shared/docs/LAYOUT_CONFIGS.md for more information
export type CreatorAnalyticsEmbeddedSurfaceConfig = CreatorAnalyticsPageSurfaceConfig & {
  debugPageName?: string;
  mode: CreatorAnalyticsPageMode.Embedded;
};

// For economy-like pages... probably also immersive-ads
// See ../experience-analytics-shared/docs/LAYOUT_CONFIGS.md for more information
export type CreatorAnalyticsBreakdownTabPageConfig<
  TDim extends RAQIV2Dimension,
  TDimValues extends string,
> = RAQIV2PageConfig & {
  mode: CreatorAnalyticsPageMode.BreakdownTab;
  tabBreakdownDimension: TDim;
  // The date range to look back when querying for dimension values. If not provided will default to use bundle date range.
  tabBreakdownDateRange?: TDateRangeSelection;
  filteredTabDefinition: {
    getTabContextSpecOverride: (value: TDimValues) => SpecOverride;
    config: CreatorAnalyticsPageSurfaceConfig;
  };
  noTabEmptyState: CreatorAnalyticsPageSurfaceConfig;
  preTabCharts?: RAQIV2PreControlComponent[];
};

// For most other pages...
// See ../experience-analytics-shared/docs/LAYOUT_CONFIGS.md for more information
export type CreatorAnalyticsUntabbedPageConfig = {
  mode: CreatorAnalyticsPageMode.Untabbed;
} & RAQIV2PageConfig &
  CreatorAnalyticsPageSurfaceConfig;

// See ../experience-analytics-shared/docs/LAYOUT_CONFIGS.md for more information
export enum CreatorAnalyticsPageMode {
  Embedded = 'Embedded',
  FixedTab = 'FixedTab',
  BreakdownTab = 'BreakdownTab',
  Untabbed = 'Untabbed',
}

// Unified type used by the <CreatorAnalyticsLayout> component
// When typing your config, use the appropriate specific type from below
export type CreatorAnalyticsPageConfig<
  TTab extends string,
  TDim extends RAQIV2Dimension,
  TDimValues extends string,
> =
  | CreatorAnalyticsEmbeddedSurfaceConfig
  | CreatorAnalyticsFixedTabPageConfig<TTab>
  | CreatorAnalyticsBreakdownTabPageConfig<TDim, TDimValues>
  | CreatorAnalyticsUntabbedPageConfig;
