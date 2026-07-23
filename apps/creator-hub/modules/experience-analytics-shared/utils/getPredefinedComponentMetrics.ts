import { TRAQIV2APIMetric, RAQIV2Metric, TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { getMetricsFromPredefinedChart } from '../constants/RAQIV2PredefinedChartConfig';
import { getMetricsFromPredefinedTabbedChart } from '../constants/RAQIV2PredefinedTabbedChartConfig';
import { RAQIV2UIComponent } from '../types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '../types/RAQIV2SpecialLayoutConfig';
import { getTypedUIOrLayoutComponent } from './getTypedComponentKey';
import getAPIMetricFromUIMetric from './getAPIMetricFromUIMetric';
import { isMetricTableColumnConfig } from '../constants/RAQIV2PredefinedTableColumnConfig';

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
      return dataColumns.filter(isMetricTableColumnConfig).map(({ metric }) => metric);
    }
    case AnalyticsComponentType.Layout: {
      const { config } = typedComponent;
      const { type: layoutType } = config;
      switch (layoutType) {
        case RAQIV2SpecialLayoutType.VerticalPriorityLayout: {
          const { firstColumn, secondColumn } = config;
          return [...firstColumn, ...secondColumn]
            .map((key) => {
              return getPredefinedComponentUIMetrics(key);
            })
            .flat();
        }
        case RAQIV2SpecialLayoutType.RowLayout:
        case RAQIV2SpecialLayoutType.FullWidthLayout: {
          const { items } = config;
          return items
            .map((key) => {
              return getPredefinedComponentUIMetrics(key);
            })
            .flat();
        }
        case RAQIV2SpecialLayoutType.DropdownSelectorLayout: {
          const { items } = config;
          return items
            .map(({ value }) => {
              return getPredefinedComponentUIMetrics(value);
            })
            .flat();
        }
        case RAQIV2SpecialLayoutType.SectionTitle: {
          return [];
        }
        default: {
          const exhaustiveCheck: never = layoutType;
          throw new Error(`Unhandled special layout type: ${exhaustiveCheck}`);
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
      const dataColumns = tableConfigs.map(({ config }) => config.dataColumns).flat();
      return dataColumns.filter(isMetricTableColumnConfig).map(({ metric }) => metric);
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
      throw new Error(`Unknown metrics for component type: ${exhaustiveCheck}`);
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
    return getAPIMetricFromUIMetric(metric, { percentileType: null, aggregationType: null });
  });
};

export default getPredefinedComponentMetrics;
