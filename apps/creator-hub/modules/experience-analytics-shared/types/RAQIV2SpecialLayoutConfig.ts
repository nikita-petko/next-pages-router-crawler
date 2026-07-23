import type { TGridProps } from '@rbx/ui';
import type {
  TranslationKey,
  TUseTranslationTranslateHTMLFunction,
} from '@modules/analytics-translations/types';
import type { NonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { OnboardingTipsConfigs } from '../constants/onboardingTipsConfigs';
import type { AnalyticsComponentConfig, RAQIV2UIComponent } from './RAQIV2PageConfig';

export enum RAQIV2SpecialLayoutType {
  // Default behaviour: fullWidth on smaller screens, and two-column on larger screens.
  ResponsiveOneOrTwoColumnLayout = 'ResponsiveOneOrTwoColumnLayout',

  // Two-column flex on larger windows. Specific ordering of elements in each column; columns are independent.
  // Single column on small windows (all elements in LHS followed by all element in RHS)
  VerticalPriorityLayout = 'VerticalPriorityLayout',

  // All items will be rendered full-width.
  FullWidthLayout = 'FullWidthLayout',

  // All items render side-by-side in a single row, each at its NATURAL CONTENT
  // WIDTH (no flex sizing imposed). Use this for compact summary-card rows
  // where the cards should sit next to each other at their intrinsic size and
  // not stretch to fill the row. Items do NOT wrap; if the row overflows the
  // container, items will overflow horizontally rather than wrap.
  //
  // Choose this over `TwoPerRowLayout` when:
  //   - You have a small fixed number of summary cards (typically 2–4) and
  //     want them tight against each other on the left, with empty space on
  //     the right of the row.
  //   - Items have well-bounded intrinsic widths and you do NOT want each one
  //     to expand to a fixed share of the row.
  RowLayout = 'RowLayout',

  // Items render two-per-row, each occupying exactly 50% of the container
  // width at every breakpoint, with additional items WRAPPING onto subsequent
  // rows of two. With N items you get ceil(N / 2) rows; an odd final item
  // takes the left half and leaves the right half empty.
  //
  // Responsiveness is OPT-IN: set `stackOnCompact: true` on the layout config
  // to render items full-width on compact screens and two-per-row only from the
  // Medium breakpoint up (see `RAQIV2TwoPerRowLayoutConfig`). Without it, items
  // stay at 50% width at every breakpoint.
  //
  // Choose this over `RowLayout` when:
  //   - You want predictable equal-width slots (e.g. for chart cards whose
  //     widths must match) regardless of content size.
  //   - You want overflow to wrap rather than scroll/clip.
  //   - The layout participates in the resizable-charts drag/drop dashboard
  //     (the renderer tags this layout's container with
  //     `data-raqi-layout="row"` so the resize logic can find it).
  TwoPerRowLayout = 'TwoPerRowLayout',

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

export type RAQIV2TwoPerRowLayoutConfig<T extends AnalyticsComponentConfig> = {
  type: RAQIV2SpecialLayoutType.TwoPerRowLayout;
  items: T[];
  // Opt-in responsiveness. When true, items render full-width on compact
  // screens and switch to two-per-row from the Medium breakpoint up; when false
  // or omitted (the default), items stay at 50% width at every breakpoint.
  stackOnCompact?: boolean;
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

// A single line of section-title body copy. `link` (optional) substitutes
// `<linkStart>...<linkEnd>` in the translation with an external <Link>. `args`
// (optional) lets callers pass interpolation values to `translateHTML`; the type
// is inherited from `translateHTML`'s third positional argument so it stays in sync.
export type RAQIV2SectionTitleDescription = {
  key: TranslationKey;
  link?: string;
  args?: Parameters<TUseTranslationTranslateHTMLFunction>[2];
};

export type RAQIV2SectionTitleLayoutConfig = {
  type: RAQIV2SpecialLayoutType.SectionTitle;
  titleKey: TranslationKey;
  tooltipKey?: TranslationKey;
  // Description lines rendered in order, separated by line breaks. Use an
  // array (even of length 1) to enable multi-paragraph section headers.
  description?: RAQIV2SectionTitleDescription[];
  onboardingTipsConfig?: OnboardingTipsConfigs;
};

export type RAQIV2SpecialLayoutConfig<T extends AnalyticsComponentConfig> =
  RAQIV2SpecialLayoutConfigBase &
    (
      | RAQIV2VerticalPriorityLayoutConfig<T>
      | RAQIV2FullWidthLayoutConfig<T>
      | RAQIV2RowLayoutConfig<T>
      | RAQIV2TwoPerRowLayoutConfig<T>
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
