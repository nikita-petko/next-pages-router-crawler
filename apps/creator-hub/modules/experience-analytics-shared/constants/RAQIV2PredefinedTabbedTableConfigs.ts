import type AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { TranslationKey } from '@modules/analytics-translations/types';
import type { AnalyticsTableConfig } from './RAQIV2PredefinedTableConfig';

// A single option in an AnalyticsTableWithControlConfig's dropdown.
export type AnalyticsTableWithControlOption = {
  key: string; // the "enum value" for this option; unique within the control's options
  labelKey: TranslationKey;
  config: AnalyticsTableConfig; // table config to render when this option is selected
};

// A table config that's driven by a dropdown control instead of being static.
// No `type` discriminant for now — distinguished from a plain AnalyticsTableConfig
// structurally via `isAnalyticsTableWithControlConfig`.
export type AnalyticsTableWithControlConfig = {
  key: string; // identity of the control; tabs sharing this key share/persist selection state
  labelKey?: TranslationKey; // optional label rendered next to the control
  defaultOptionKey?: string; // defaults to options[0].key
  options: [AnalyticsTableWithControlOption, ...AnalyticsTableWithControlOption[]];
};

export const isAnalyticsTableWithControlConfig = (
  config: AnalyticsTableConfig | AnalyticsTableWithControlConfig,
): config is AnalyticsTableWithControlConfig => 'options' in config;

type RAQIV2PredefinedTabbedTableSingleTabConfig = {
  key: string; // previously RAQIV2PredefinedTableKey, needs to be unique among tabs in a tabbed table
  config: AnalyticsTableConfig | AnalyticsTableWithControlConfig;
  labelKey: TranslationKey;
  footerKey?: TranslationKey;
};

export type AnalyticsTabbedTableConfig = {
  type: AnalyticsComponentType.TabbedTable;
  tableKey?: string; // previously RAQIV2PredefinedTabbedTableKey, only used for logging
  tabs: Array<RAQIV2PredefinedTabbedTableSingleTabConfig>;
  tabMobileLabelKey: TranslationKey;
  titleKey: TranslationKey;
  tooltipKey?: TranslationKey;
};
