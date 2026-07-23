import type { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { CreatorAnalyticsPageConfig } from '../types/RAQIV2PageConfig';
import { CreatorAnalyticsPageMode } from '../types/RAQIV2PageConfig';

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
      // Take the first non-None timeRangeOptions across all tabs so that tabs
      // with a real date-range config (e.g. an Analytics tab) aren't silently
      // overridden by a preceding tab that opts out of date picking (type: 'None').
      // Without this, the Layer 2 date-range provider only sees the first tab's
      // config and discards defaultRange / endDateBehavior from later tabs.
      const mergedTimeRangeOptions =
        tabOrder.map((key) => tabs[key].timeRangeOptions).find((opt) => opt.type !== 'None') ??
        base.timeRangeOptions;
      // Similarly, pick the first explicitly-set endDateBehavior across all tabs.
      const mergedEndDateBehavior = tabOrder
        .map((key) => tabs[key].endDateBehavior)
        .find((v) => v !== undefined);
      return {
        ...base,
        timeRangeOptions: mergedTimeRangeOptions,
        endDateBehavior: mergedEndDateBehavior,
        breakdownDimensions: allBreakdownDimensions,
        filterDimensions: allFilterDimensions,
        body: tabOrder.flatMap((key) => tabs[key].body),
      };
    }
    case CreatorAnalyticsPageMode.BreakdownTab:
      return config.filteredTabDefinition.config;
    default: {
      const exhaustiveCheck: never = mode;
      throw new Error(`Unhandled mode: ${String(exhaustiveCheck)}`);
    }
  }
};

export default getCreatorAnalyticsPageSurfaceConfig;
