import { DateRangeType } from '@modules/charts-generic';
import { TranslationKey } from '@modules/analytics-translations';
import { TRAQIV2BreakdownDimension } from '@modules/clients/analytics';
import { RAQIV2MetricGranularity, TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { ChartConfigOrPredefinedKey } from '../../../constants/RAQIV2PredefinedChartConfig';
import { TabbedChartConfigOrPredefinedKey } from '../../../constants/RAQIV2PredefinedTabbedChartConfig';
import { AnalyticsTableConfig } from '../../../constants/RAQIV2PredefinedTableConfig';
import { AnalyticsTabbedTableConfig } from '../../../constants/RAQIV2PredefinedTabbedTableConfigs';

export enum RAQIV2ControlledSubcontextType {
  DimensionFilterAndBreakdownOverride = 'DimensionFilterAndBreakdownOverride',
  TimeRangeOverride = 'TimeRangeOverride',
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
  breakdownDimensions: TRAQIV2BreakdownDimension[];
};

export type RAQIV2DimensionFilterAndBreakdownOverrideConfig = {
  filterDimension: TRAQIV2Dimension;
  breakdownDimensions: TRAQIV2BreakdownDimension[];
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
    controlConfigs: // Maximum 2 controlled subcontext
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
  dateRangeOptions: ReadonlyArray<DateRangeType>;
  defaultDateRangeType: DateRangeType;
  granularityByDateRangeOverride: { [key in DateRangeType]?: RAQIV2MetricGranularity };
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
