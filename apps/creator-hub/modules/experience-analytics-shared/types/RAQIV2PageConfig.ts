import React from 'react';
import {
  type AnalyticsNavigationItem,
  DateRangeType,
  AnalyticsDocLink,
  SingleDateType,
} from '@modules/charts-generic';
import { TranslationKey } from '@modules/analytics-translations';
import {
  TRAQIV2BreakdownDimension,
  RAQIV2QueryFilter,
  RAQIV2ChartResourceType,
  AnnotationType,
} from '@modules/clients/analytics';
import {
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
  TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import RAQIV2EligibilityChecker from './RAQIV2EligibilityChecker';
import { TUIGranularity } from '../utils/seriesGranularities';
import type { RAQIV2SpecialLayoutConfig } from './RAQIV2SpecialLayoutConfig';
import { SpecOverride } from '../utils/computeRAQIV2SpecOverride';
import { AnalyticsTabbedTableConfig } from '../constants/RAQIV2PredefinedTabbedTableConfigs';
import TTimeRangeSpec from './TimeRangeSpec';
import { OnboardingTipsConfigs } from '../constants/onboardingTipsConfigs';
import { ChartConfig, ChartConfigOrPredefinedKey } from '../constants/RAQIV2PredefinedChartConfig';
import {
  TabbedChartConfig,
  TabbedChartConfigOrPredefinedKey,
} from '../constants/RAQIV2PredefinedTabbedChartConfig';
import { AnalyticsControlledSubcontextConfig } from '../components/RAQIV2/subcontext/RAQIV2ControlledSubcontextConfig';
import { AnalyticsTableConfig } from '../constants/RAQIV2PredefinedTableConfig';
import { AnalyticsSummaryCardConfig } from '../constants/RAQIV2PredefinedSummaryCardConfig';
import { ArbitraryComponentConfig } from '../components/RAQIV2/layout/AnalyticsArbitraryComponent';

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

/** We limit the options here because they are sometimes rendered without a real chart context. */
export type RAQIV2PreControlComponent =
  | ArbitraryComponentConfig
  | RAQIV2SpecialLayoutConfig<ArbitraryComponentConfig>;

export enum GranularityConstraint {
  NOT_ALLOWED = 'NOT_ALLOWED',
  MOST_RECENT_SEVEN_DAYS = 'MOST_RECENT_SEVEN_DAYS',
}

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
      supportedRanges: DateRangeType[];
      defaultRange: DateRangeType;
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
      DateRangeType.Last7Days,
      DateRangeType.Last28Days,
      DateRangeType.Last56Days,
      DateRangeType.Last90Days,
      DateRangeType.Last365Days,
      DateRangeType.Custom,
    ],
    defaultRange: DateRangeType.Last28Days,
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
  surfaceAnnotationOptions: AnnotationOptions;

  filterDimensions: ReadonlyArray<TRAQIV2Dimension>;
  // isInitialValueOnly: if true, the filter will only apply when page first load and can be modified
  defaultFilters?: (RAQIV2QueryFilter & { isInitialValueOnly?: boolean })[];

  // Right side controls:
  breakdownDimensions: ReadonlyArray<TRAQIV2BreakdownDimension>;
  defaultBreakdown?: ReadonlyArray<TRAQIV2BreakdownDimension>;

  granularity?:
    | {
        options: TUIGranularity[];
        constraints?: Partial<Record<TUIGranularity, GranularityConstraint>>;
      }
    | { fixed: RAQIV2MetricGranularity };

  // Surface Body Components
  body: RAQIV2UIComponent[];

  // NOTE(shumingxu, 2024/07/02): This is not used right now but allows for tab-specific eligibility checks in the future
  eligibility?: RAQIV2PageEligibilityConfig;

  // NOTE(gperkins, 2024/08/13): We can't render most components in the pre-control section because they rely on the chart context
  preControlCharts?: RAQIV2PreControlComponent[];
  // NOTE(shumingxu, 2024/10/08): This is used to set the date range for the pre-control components
  // e.g. past 3 days for realtime monetization, past 90 days for custom event selector
  preControlComponentDateRange?: TTimeRangeSpec;

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
};

export type RAQIV2PageEligibilityConfig = {
  checkerType: RAQIV2EligibilityChecker;
  ineligibleMessage: TranslationKey;
  ignorePreControlComponents: boolean;
};

export type RAQIV2PageConfig = {
  debugPageName?: string;
  title: TranslationKey;
  description: {
    standard: TranslationKey;
    tooltipText?: TranslationKey;
    mobile?: TranslationKey;
  };
  action?: React.ReactElement;
  eligibility?: RAQIV2PageEligibilityConfig;
  /** Navigation item for this page, used by tabbed layouts to auto-construct HubMeta titles. */
  navigationItem?: AnalyticsNavigationItem;

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
  tabBreakdownDateRange?: TTimeRangeSpec;
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
