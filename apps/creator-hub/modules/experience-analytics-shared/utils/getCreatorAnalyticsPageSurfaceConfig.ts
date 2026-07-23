import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { CreatorAnalyticsPageConfig, CreatorAnalyticsPageMode } from '../types/RAQIV2PageConfig';

const getCreatorAnalyticsPageSurfaceConfig = <
  TTab extends string,
  TDim extends RAQIV2Dimension,
  TDimValues extends string,
>(
  config: CreatorAnalyticsPageConfig<TTab, TDim, TDimValues>,
) => {
  const { mode } = config;
  switch (mode) {
    case CreatorAnalyticsPageMode.Embedded:
    case CreatorAnalyticsPageMode.Untabbed:
      return config;
    case CreatorAnalyticsPageMode.FixedTab: {
      const { tabs, tabOrder } = config;
      const [first] = tabOrder;
      const base = tabs[first];
      // Merge breakdownDimensions and filterDimensions from all tabs so that
      // Layer 2 context (PageConfigAwareBreakdownProvider, etc.) allows dimensions
      // from any tab. Without this, only the first tab's dimensions would be allowed,
      // causing dimensions like AgeGroup to be filtered out on other tabs.
      const allBreakdownDimensions = Array.from(
        new Set(tabOrder.flatMap((key) => tabs[key].breakdownDimensions ?? [])),
      );
      const allFilterDimensions = Array.from(
        new Set(tabOrder.flatMap((key) => tabs[key].filterDimensions ?? [])),
      );
      return {
        ...base,
        breakdownDimensions: allBreakdownDimensions,
        filterDimensions: allFilterDimensions,
        body: tabOrder.flatMap((key) => tabs[key].body),
      };
    }
    case CreatorAnalyticsPageMode.BreakdownTab:
      return config.filteredTabDefinition.config;
    default: {
      const exhaustiveCheck: never = mode;
      throw new Error(`Unhandled mode: ${exhaustiveCheck}`);
    }
  }
};

export default getCreatorAnalyticsPageSurfaceConfig;
