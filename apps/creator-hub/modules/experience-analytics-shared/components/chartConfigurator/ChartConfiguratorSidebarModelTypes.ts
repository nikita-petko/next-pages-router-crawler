import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { TranslationKey, FormattedText } from '@modules/analytics-translations/types';
import type { ChartResource as RAQIV2ChartResource } from '@modules/clients/analytics/analyticsRAQIShared';
import type { ChartConfiguratorChartType } from '../../chartConfigurator/ChartConfiguratorChartTypes';
import type { TChartConfiguratorMetrics } from '../../chartConfigurator/chartConfiguratorMetricsConfig';
import type { ControlledChartConfiguratorGranularitySelection } from '../../chartConfigurator/controlledChartConfiguratorState';
import type { ChartTypeMetricSupport } from '../../chartConfigurator/isChartTypeSupportedForMetric';
import type {
  ComparisonCustomStartDateValue,
  ComparisonOffsetValue,
} from '../../chartConfigurator/overlayUrlParams';
import type { SmoothingOption } from '../../chartConfigurator/smoothingOptions';
import type { L7SmoothingDisabledReason } from '../../exploreMode/l7SmoothingEligibility';
import type { BenchmarkOverlayType } from '../../hooks/useAnalyticsBenchmarks';
import type { UIFilters } from '../../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import type { ComputedMetric } from '../../types/ComputedMetric';
import type RAQIV2ChartContext from '../../types/RAQIV2ChartContext';
import type { OverlayAvailability } from '../../utils/getOverlayAvailability';
import type { TUIGranularity } from '../../utils/seriesGranularities';
import type { SourceFilterDimensionsByMetric } from './ChartConfiguratorEquationBuilder';
import type { ExploreModeMetricSourceFilterDrawerConfig } from './ChartConfiguratorMetricSourceCard';
import type { OverlayOption } from './ChartConfiguratorOverlaysControl';
import type { ExploreModeTableMetricColumn } from './chartConfiguratorTableColumns';

type ChartConfiguratorMetricControlsBaseProps = {
  metric: TChartConfiguratorMetrics | null;
  computedMetric: ComputedMetric | null;
  availableMetrics: TChartConfiguratorMetrics[];
  constraintMetrics: readonly TChartConfiguratorMetrics[];
  sourceFilterResource?: ExploreModeMetricSourceFilterDrawerConfig['resource'];
  sourceFilterDimensionsByMetric?: SourceFilterDimensionsByMetric;
};

/**
 * Grouped prop contract for the metric/source/operations portion of the sidebar.
 *
 * Keep impossible UI states out of callers by choosing exactly one mode:
 * - `metric`: standard metric picker with optional source filtering.
 * - `custom-events`: custom event filters are active and required.
 * - `operations`: equation builder owns metric selection.
 */
export type ChartConfiguratorMetricControlsProps = ChartConfiguratorMetricControlsBaseProps &
  (
    | {
        mode: 'custom-events';
        sourceFilter: TranslationKey | null;
        customEventResource: RAQIV2ChartResource;
        filters: UIFilters;
        /**
         * When true, the event-name combobox auto-focuses on mount. Set
         * by the parent only when Explore mode just defaulted the source
         * to Custom Events on the user's behalf — see
         * `useExploreModeLastSourcePersistence`.
         */
        autoFocusEventName?: boolean;
      }
    | {
        mode: 'metric';
        sourceFilter: TranslationKey | null;
        filteredMetrics: TChartConfiguratorMetrics[];
        customEventResource?: never;
        filters?: never;
        autoFocusEventName?: never;
      }
    | {
        mode: 'operations';
        sourceFilter?: never;
        filteredMetrics?: never;
        customEventResource?: never;
        filters?: never;
        autoFocusEventName?: never;
      }
  );

export type ChartConfiguratorChartControlsProps = {
  chartType: ChartConfiguratorChartType;
  availableChartTypes: readonly ChartConfiguratorChartType[];
  supportedChartTypes: readonly ChartConfiguratorChartType[];
  chartTypeSupport: Record<ChartConfiguratorChartType, ChartTypeMetricSupport>;
};

/**
 * Optional overlay controls use a disabled/enabled union so consumers do not
 * need to pass placeholder overlay state when a surface does not support overlays.
 */
export type ChartConfiguratorOverlayControlsProps =
  | {
      isEnabled: false;
    }
  | {
      isEnabled: true;
      overlayOption: OverlayOption;
      benchmarkType: BenchmarkOverlayType | null;
      availableBenchmarkTypes?: readonly BenchmarkOverlayType[];
      comparisonOffset: ComparisonOffsetValue;
      comparisonCustomStartDate: ComparisonCustomStartDateValue;
      overlayAvailability: OverlayAvailability;
    };

/**
 * Optional authored-title control. Surfaces that let users name a chart
 * (e.g. the custom-dashboard chart editor) pass this group to render a title
 * input at the top of the sidebar. Omitted by surfaces without authored titles
 * (e.g. Explore mode).
 */
export type ChartConfiguratorTitleControlsProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  error?: string | null;
  maxLength?: number;
};

export type ChartConfiguratorSmoothingControlsProps = {
  smoothingOption: SmoothingOption;
  isL7SmoothingDisabled?: boolean;
  l7SmoothingDisabledReason?: L7SmoothingDisabledReason | null;
};

export type ChartConfiguratorGranularityControlsProps = {
  chartContext: RAQIV2ChartContext;
  granularitySelection?: ControlledChartConfiguratorGranularitySelection;
};

export type ChartConfiguratorBreakdownControlsProps = {
  breakdownDimensions: readonly TRAQIV2Dimension[];
  breakdown: readonly TRAQIV2Dimension[];
  getBreakdownLabel: (dimension: TRAQIV2Dimension) => FormattedText;
};

/**
 * Chart mode and table mode intentionally share the same sidebar surface.
 * Table mode swaps overlays for additional metric-column controls and enables
 * table-only breakdown affordances, while chart mode keeps those props absent.
 */
export type ChartConfiguratorTableControlsProps =
  | {
      mode: 'chart';
    }
  | {
      /**
       * Table mode hides overlays, exposes a Timestamp toggle inside the
       * breakdown dropdown, and shows additional metric column controls
       * underneath. Multi-select breakdown behavior is identical in both
       * modes — only the Timestamp affordance is table-only.
       */
      mode: 'table';
      tableAdditionalColumns?: ExploreModeTableMetricColumn[];
      /**
       * Total number of "primary" metric columns already present in the table view
       * (the main metric/equation builder result, plus any operations-mode source
       * columns derived from the equation builder). Used to enforce column limits.
       */
      tablePrimaryColumnCount?: number;
    };

/**
 * Sidebar events are intentionally modeled as a single dispatch API instead of
 * many setter props. Consumers own persistence/routing/reducer behavior; the
 * sidebar only describes the user intent that occurred.
 */
export type ChartConfiguratorSidebarAction =
  | { type: 'select-metric'; metric: TChartConfiguratorMetrics | null }
  | { type: 'set-computed-metric'; computedMetric: ComputedMetric | null }
  | { type: 'set-source-filter'; sourceFilter: TranslationKey | null }
  | { type: 'set-custom-event-filters'; filters: UIFilters }
  | { type: 'toggle-operations'; isOn: boolean }
  | { type: 'select-chart-type'; chartType: ChartConfiguratorChartType }
  | {
      type: 'select-chart-type-with-granularity';
      chartType: ChartConfiguratorChartType;
      granularity: TUIGranularity;
    }
  | { type: 'select-granularity'; granularity: TUIGranularity }
  | { type: 'set-breakdown'; breakdown: TRAQIV2Dimension[] }
  | { type: 'set-overlay-option'; overlayOption: OverlayOption }
  | { type: 'set-benchmark-type'; benchmarkType: BenchmarkOverlayType | null }
  | { type: 'set-comparison-offset'; comparisonOffset: ComparisonOffsetValue }
  | {
      type: 'set-comparison-custom-start-date';
      comparisonCustomStartDate: ComparisonCustomStartDateValue;
    }
  | { type: 'set-smoothing-option'; smoothingOption: SmoothingOption }
  | {
      type: 'set-table-additional-columns';
      tableAdditionalColumns: ExploreModeTableMetricColumn[];
    };

export type ChartConfiguratorSidebarDispatch = (action: ChartConfiguratorSidebarAction) => void;

/**
 * Public sidebar contract. Callers should build stable grouped prop objects for
 * each control family and handle all mutations through `dispatch`.
 *
 * Derived values and cross-control transitions belong in
 * `useChartConfiguratorSidebarModel`; render-only subcomponent prop types should
 * stay local to `ChartConfiguratorSidebar.tsx`.
 */
export type ChartConfiguratorSidebarProps = {
  variant?: 'inline' | 'sheet';
  onCollapse?: () => void;
  dispatch: ChartConfiguratorSidebarDispatch;
  titleControls?: ChartConfiguratorTitleControlsProps;
  metricControls: ChartConfiguratorMetricControlsProps;
  chartControls: ChartConfiguratorChartControlsProps;
  granularityControls: ChartConfiguratorGranularityControlsProps;
  breakdownControls: ChartConfiguratorBreakdownControlsProps;
  smoothingControls: ChartConfiguratorSmoothingControlsProps;
  overlayControls?: ChartConfiguratorOverlayControlsProps;
  tableControls?: ChartConfiguratorTableControlsProps;
};

export function assertUnhandledSidebarAction(action: never): never {
  throw new Error(`Unhandled chart configurator sidebar action: ${String(action)}`);
}
