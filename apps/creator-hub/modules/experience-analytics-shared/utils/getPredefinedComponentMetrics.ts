import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2APIMetric, TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { getMetricsFromPredefinedChart } from '../constants/RAQIV2PredefinedChartConfig';
import { getMetricsFromPredefinedTabbedChart } from '../constants/RAQIV2PredefinedTabbedChartConfig';
import { isMetricTableColumnConfig } from '../constants/RAQIV2PredefinedTableColumnConfig';
import { getAtomicMetricsFromMetricLike } from '../types/ComputedMetric';
import type { RAQIV2UIComponent } from '../types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '../types/RAQIV2SpecialLayoutConfig';
import { getAPIMetricFromUIMetric } from './getAPIMetricFromUIMetric';
import { getTypedUIOrLayoutComponent } from './getTypedComponentKey';

export const getPredefinedComponentUIMetrics = (
  given: RAQIV2UIComponent,
): Array<TRAQIV2UIMetric> => {
  const typedComponent = getTypedUIOrLayoutComponent(given);
  const { type } = typedComponent;
  switch (type) {
    case AnalyticsComponentType.Chart: {
      const { keyOrConfig } = typedComponent;
      return getMetricsFromPredefinedChart(keyOrConfig);
    }
    case AnalyticsComponentType.TabbedChart: {
      const { keyOrConfig } = typedComponent;
      return getMetricsFromPredefinedTabbedChart(keyOrConfig);
    }
    case AnalyticsComponentType.Table: {
      const { config } = typedComponent;
      const { dataColumns } = config;
      // For computed metrics, fan out to the atomic source metrics so callers
      // (assistant query builder, etc.) see the underlying inputs.
      return dataColumns
        .filter(isMetricTableColumnConfig)
        .flatMap(({ metric }) => getAtomicMetricsFromMetricLike(metric));
    }
    case AnalyticsComponentType.Layout: {
      const { config } = typedComponent;
      const { type: layoutType } = config;
      switch (layoutType) {
        case RAQIV2SpecialLayoutType.VerticalPriorityLayout: {
          const { firstColumn, secondColumn } = config;
          return [...firstColumn, ...secondColumn].flatMap((key) => {
            return getPredefinedComponentUIMetrics(key);
          });
        }
        case RAQIV2SpecialLayoutType.RowLayout:
        case RAQIV2SpecialLayoutType.TwoPerRowLayout:
        case RAQIV2SpecialLayoutType.FullWidthLayout: {
          const { items } = config;
          return items.flatMap((key) => {
            return getPredefinedComponentUIMetrics(key);
          });
        }
        case RAQIV2SpecialLayoutType.DropdownSelectorLayout: {
          const { items } = config;
          return items.flatMap(({ value }) => {
            return getPredefinedComponentUIMetrics(value);
          });
        }
        case RAQIV2SpecialLayoutType.SectionTitle: {
          return [];
        }
        default: {
          const exhaustiveCheck: never = layoutType;
          throw new Error(`Unhandled special layout type: ${String(exhaustiveCheck)}`);
        }
      }
    }
    case AnalyticsComponentType.SummaryCard: {
      const { config } = typedComponent;
      const { metric } = config;
      return [metric];
    }
    case AnalyticsComponentType.TabbedTable: {
      const { config: tabbedTableConfig } = typedComponent;
      const tableConfigs = tabbedTableConfig.tabs;
      const dataColumns = tableConfigs.flatMap(({ config }) => config.dataColumns);
      return dataColumns
        .filter(isMetricTableColumnConfig)
        .flatMap(({ metric }) => getAtomicMetricsFromMetricLike(metric));
    }
    case AnalyticsComponentType.ControlledSubcontext: {
      const { config } = typedComponent;
      const { body } = config;
      return getPredefinedComponentUIMetrics(body);
    }
    case AnalyticsComponentType.NonGeneric: {
      const { config } = typedComponent;
      const { metrics } = config;
      return metrics;
    }
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unknown metrics for component type: ${String(exhaustiveCheck)}`);
    }
  }
};

export const getPageSurfaceMetrics = (body: RAQIV2UIComponent[]): TRAQIV2UIMetric[] => [
  ...new Set(body.flatMap(getPredefinedComponentUIMetrics)),
];

const getPredefinedComponentMetrics = (given: RAQIV2UIComponent): Array<TRAQIV2APIMetric> => {
  return getPredefinedComponentUIMetrics(given).map((metric) => {
    if (isValidEnumValue(RAQIV2Metric, metric)) {
      return metric;
    }
    return getAPIMetricFromUIMetric(metric, { percentile: null, aggregationType: null });
  });
};

export default getPredefinedComponentMetrics;
