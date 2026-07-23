import type { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { RAQIV2DateRangeType, TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { TranslationKey } from '@modules/analytics-translations/types';
import type { ChartConfigOrPredefinedKey } from '../../../constants/RAQIV2PredefinedChartConfig';
import type { TabbedChartConfigOrPredefinedKey } from '../../../constants/RAQIV2PredefinedTabbedChartConfig';
import type { AnalyticsTabbedTableConfig } from '../../../constants/RAQIV2PredefinedTabbedTableConfigs';
import type { AnalyticsTableConfig } from '../../../constants/RAQIV2PredefinedTableConfig';

export enum RAQIV2ControlledSubcontextType {
  DimensionFilterAndBreakdownOverride = 'DimensionFilterAndBreakdownOverride',
  TimeRangeOverride = 'TimeRangeOverride',
}

export enum RAQIV2DefaultFilterDimensionValueMode {
  LastOption = 'LastOption',
}

type AnalyticsSubcontextConfigBase = {
  type: AnalyticsComponentType.ControlledSubcontext;
  subcontextType: RAQIV2ControlledSubcontextType;
  // TODO(gperkins@20240725): AnalyticsComponentConfig would be more ideal
  // but we need to generalize the header logic first...
  body:
    | ChartConfigOrPredefinedKey
    | TabbedChartConfigOrPredefinedKey
    | AnalyticsTableConfig
    | AnalyticsTabbedTableConfig;
};

type TUnfilteredEntry = {
  text: TranslationKey;
  breakdownDimensions: TRAQIV2Dimension[];
};

export type RAQIV2DimensionFilterAndBreakdownOverrideConfig = {
  filterDimension: TRAQIV2Dimension;
  breakdownDimensions: TRAQIV2Dimension[];
  multiple?: boolean;
  maxSelectedOptions?: number;
  defaultFilterDimensionValueMode?: RAQIV2DefaultFilterDimensionValueMode;
  pinDefaultFilterDimensionValue?: boolean;
  filterSummaryToDefaultFilterDimensionValue?: boolean;
  truncateValue?: boolean;
} & (
  | {
      defaultFilterDimensionValue: string;
      unfilteredEntry?: TUnfilteredEntry;
    }
  | {
      defaultFilterDimensionValue?: string;
      unfilteredEntry: TUnfilteredEntry;
    }
);

export type RAQIV2DimensionFilterAndBreakdownOverrideSubcontextConfig =
  AnalyticsSubcontextConfigBase & {
    type: AnalyticsComponentType.ControlledSubcontext;
    subcontextType: RAQIV2ControlledSubcontextType.DimensionFilterAndBreakdownOverride;
    selectionStateKey?: string;
    controlConfigs:
      // Maximum 2 controlled subcontext
      // reach out to #creator-analytic for design review > 2 control is needed
      | [RAQIV2DimensionFilterAndBreakdownOverrideConfig]
      | [
          RAQIV2DimensionFilterAndBreakdownOverrideConfig,
          RAQIV2DimensionFilterAndBreakdownOverrideConfig,
        ];
  };

export enum RAQIV2TimeRangeControlMode {
  DateRangeDropdown = 'DateRangeDropdown',
  ZoomResetOnly = 'ZoomResetOnly',
}

type TimeRangeDropdownConfig = AnalyticsSubcontextConfigBase & {
  type: AnalyticsComponentType.ControlledSubcontext;
  subcontextType: RAQIV2ControlledSubcontextType.TimeRangeOverride;
  controlMode: RAQIV2TimeRangeControlMode.DateRangeDropdown;
  dateRangeOptions: ReadonlyArray<RAQIV2DateRangeType>;
  defaultDateRangeType: RAQIV2DateRangeType;
  granularityByDateRangeOverride: { [key in RAQIV2DateRangeType]?: RAQIV2MetricGranularity };
};

type ZoomResetOnlyConfig = AnalyticsSubcontextConfigBase & {
  type: AnalyticsComponentType.ControlledSubcontext;
  subcontextType: RAQIV2ControlledSubcontextType.TimeRangeOverride;
  controlMode: RAQIV2TimeRangeControlMode.ZoomResetOnly;
};

export type RAQIV2TimeRangeOverrideSubcontextConfig = TimeRangeDropdownConfig | ZoomResetOnlyConfig;

export type AnalyticsControlledSubcontextConfig =
  | RAQIV2DimensionFilterAndBreakdownOverrideSubcontextConfig
  | RAQIV2TimeRangeOverrideSubcontextConfig;
