import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { TGridProps } from '@rbx/ui';
import { NonEmptyArray } from '@modules/charts-generic';
import { TranslationKey } from '@modules/analytics-translations';
import type { AnalyticsComponentConfig, RAQIV2UIComponent } from './RAQIV2PageConfig';
import { OnboardingTipsConfigs } from '../constants/onboardingTipsConfigs';

export enum RAQIV2SpecialLayoutType {
  // Default behaviour: fullWidth on smaller screens, and two-column on larger screens.
  ResponsiveOneOrTwoColumnLayout = 'ResponsiveOneOrTwoColumnLayout',

  // Two-column flex on larger windows. Specific ordering of elements in each column; columns are independent.
  // Single column on small windows (all elements in LHS followed by all element in RHS)
  VerticalPriorityLayout = 'VerticalPriorityLayout',

  // All items will be rendered full-width.
  FullWidthLayout = 'FullWidthLayout',

  // All items render in a single row.
  RowLayout = 'RowLayout',

  // NOTE(shumingxu, 2025-01-15): This is a simplification of having dropdowns within component themselves.
  // That requires a larger framework-level change to support, so we are using this as a stop-gap to support affiliate link GA.
  // A dropdown component allows you to select a single item from a list of items.
  DropdownSelectorLayout = 'DropdownSelectorLayout',

  // A section title component.
  SectionTitle = 'SectionTitle',
}

// The union of all overrideable props.
type OverrideableProps = 'spacing' | 'marginBottom' | 'style';

type RAQIV2SpecialLayoutConfigBase = {
  type: RAQIV2SpecialLayoutType;
  stylingOverride?: Partial<Pick<TGridProps, OverrideableProps>>;
};

export type RAQIV2VerticalPriorityLayoutConfig<T extends AnalyticsComponentConfig> = {
  type: RAQIV2SpecialLayoutType.VerticalPriorityLayout;
  firstColumn: T[];
  secondColumn: T[];
};

export type RAQIV2FullWidthLayoutConfig<T extends AnalyticsComponentConfig> = {
  type: RAQIV2SpecialLayoutType.FullWidthLayout;
  items: T[];
};

export type RAQIV2RowLayoutConfig<T extends AnalyticsComponentConfig> = {
  type: RAQIV2SpecialLayoutType.RowLayout;
  items: T[];
};

export type RAQIV2DropdownSelectorLayoutConfig<T extends AnalyticsComponentConfig> = {
  type: RAQIV2SpecialLayoutType.DropdownSelectorLayout;
  label: TranslationKey;
  items: NonEmptyArray<{
    label: TranslationKey;
    value: T;
  }>;
  id?: string;
};

export type RAQIV2SectionTitleLayoutConfig = {
  type: RAQIV2SpecialLayoutType.SectionTitle;
  titleKey: TranslationKey;
  tooltipKey?: TranslationKey;
  description?: {
    key: TranslationKey;
    link?: string;
  };
  onboardingTipsConfig?: OnboardingTipsConfigs;
};

export type RAQIV2SpecialLayoutConfig<T extends AnalyticsComponentConfig> =
  RAQIV2SpecialLayoutConfigBase &
    (
      | RAQIV2VerticalPriorityLayoutConfig<T>
      | RAQIV2FullWidthLayoutConfig<T>
      | RAQIV2RowLayoutConfig<T>
      | RAQIV2DropdownSelectorLayoutConfig<T>
      | RAQIV2SectionTitleLayoutConfig
    );

export const isRAQIV2SpecialLayoutConfig = (
  config: RAQIV2UIComponent,
): config is RAQIV2SpecialLayoutConfig<AnalyticsComponentConfig> => {
  return (
    config &&
    typeof config === 'object' &&
    'type' in config &&
    isValidEnumValue(RAQIV2SpecialLayoutType, config.type)
  );
};
