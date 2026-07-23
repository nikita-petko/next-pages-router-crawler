import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { ArbitraryComponentConfig } from '../components/RAQIV2/layout/AnalyticsArbitraryComponent';
import type { AnalyticsControlledSubcontextConfig } from '../components/RAQIV2/subcontext/RAQIV2ControlledSubcontextConfig';
import type { ChartConfigOrPredefinedKey } from '../constants/RAQIV2PredefinedChartConfig';
import RAQIV2PredefinedChartKey from '../constants/RAQIV2PredefinedChartKey';
import type { AnalyticsSummaryCardConfig } from '../constants/RAQIV2PredefinedSummaryCardConfig';
import type { TabbedChartConfigOrPredefinedKey } from '../constants/RAQIV2PredefinedTabbedChartConfig';
import RAQIV2PredefinedTabbedChartKey from '../constants/RAQIV2PredefinedTabbedChartKey';
import type { AnalyticsTabbedTableConfig } from '../constants/RAQIV2PredefinedTabbedTableConfigs';
import type { AnalyticsTableConfig } from '../constants/RAQIV2PredefinedTableConfig';
import type { AnalyticsComponentConfig, RAQIV2UIComponent } from '../types/RAQIV2PageConfig';
import type { RAQIV2SpecialLayoutConfig } from '../types/RAQIV2SpecialLayoutConfig';
import { isRAQIV2SpecialLayoutConfig } from '../types/RAQIV2SpecialLayoutConfig';

type TypedNonLayoutUIComponent =
  | { keyOrConfig: ChartConfigOrPredefinedKey; type: AnalyticsComponentType.Chart }
  | { keyOrConfig: TabbedChartConfigOrPredefinedKey; type: AnalyticsComponentType.TabbedChart }
  | { config: AnalyticsTableConfig; type: AnalyticsComponentType.Table }
  | { config: AnalyticsTabbedTableConfig; type: AnalyticsComponentType.TabbedTable }
  | {
      config: ArbitraryComponentConfig;
      type: AnalyticsComponentType.NonGeneric;
    }
  | { config: AnalyticsSummaryCardConfig; type: AnalyticsComponentType.SummaryCard }
  | {
      config: AnalyticsControlledSubcontextConfig;
      type: AnalyticsComponentType.ControlledSubcontext;
    };

type TypedUIOrLayoutComponent =
  | TypedNonLayoutUIComponent
  | {
      type: AnalyticsComponentType.Layout;
      config: RAQIV2SpecialLayoutConfig<AnalyticsComponentConfig>;
    };

const getTypedComponentKey = (keyOrConfig: AnalyticsComponentConfig): TypedNonLayoutUIComponent => {
  const isConfigLiteral = typeof keyOrConfig === 'object';
  if (isConfigLiteral) {
    switch (keyOrConfig.type) {
      case AnalyticsComponentType.Chart:
        return { keyOrConfig, type: AnalyticsComponentType.Chart };
      case AnalyticsComponentType.TabbedChart:
        return { keyOrConfig, type: AnalyticsComponentType.TabbedChart };
      case AnalyticsComponentType.ControlledSubcontext:
        return { config: keyOrConfig, type: AnalyticsComponentType.ControlledSubcontext };
      case AnalyticsComponentType.Table:
        return { config: keyOrConfig, type: AnalyticsComponentType.Table };
      case AnalyticsComponentType.TabbedTable:
        return { config: keyOrConfig, type: AnalyticsComponentType.TabbedTable };
      case AnalyticsComponentType.SummaryCard:
        return { config: keyOrConfig, type: AnalyticsComponentType.SummaryCard };
      case AnalyticsComponentType.NonGeneric:
        return { config: keyOrConfig, type: AnalyticsComponentType.NonGeneric };
      default: {
        const exhaustiveCheck: never = keyOrConfig;
        throw new Error(`Unknown predefined component config or key ${exhaustiveCheck}`);
      }
    }
  }
  if (isValidEnumValue(RAQIV2PredefinedChartKey, keyOrConfig)) {
    return { keyOrConfig, type: AnalyticsComponentType.Chart };
  }
  if (isValidEnumValue(RAQIV2PredefinedTabbedChartKey, keyOrConfig)) {
    return { keyOrConfig, type: AnalyticsComponentType.TabbedChart };
  }
  const exhaustiveCheck: never = keyOrConfig;
  throw new Error(`Unknown predefined component config or key ${exhaustiveCheck}`);
};
export default getTypedComponentKey;

export const getTypedUIOrLayoutComponent = (
  component: RAQIV2UIComponent,
): TypedUIOrLayoutComponent => {
  if (isRAQIV2SpecialLayoutConfig(component)) {
    return { type: AnalyticsComponentType.Layout, config: component };
  }
  return getTypedComponentKey(component);
};
