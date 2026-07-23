import type { TGridProps } from '@rbx/ui';
import type { AnalyticsComponentConfig } from '../types/RAQIV2PageConfig';
import type { RAQIV2SpecialLayoutConfig } from '../types/RAQIV2SpecialLayoutConfig';
import { RAQIV2SpecialLayoutType } from '../types/RAQIV2SpecialLayoutConfig';

const SpecialLayoutTypeGridContainerProps: Record<RAQIV2SpecialLayoutType, TGridProps | undefined> =
  {
    [RAQIV2SpecialLayoutType.ResponsiveOneOrTwoColumnLayout]: undefined,
    [RAQIV2SpecialLayoutType.VerticalPriorityLayout]: {
      item: true,
      container: true,
      justifyContent: 'space-around',
      direction: 'row',
      spacing: '24px',
      alignItems: 'flex-start',
    },
    [RAQIV2SpecialLayoutType.FullWidthLayout]: {
      item: true,
      container: true,
      XSmall: 12,
      spacing: 5,
    },
    // RowLayout: container is full-width and lays out items in a single
    // horizontal row. Items size to their intrinsic content width (see
    // GenericAnalyticsLayoutItem) and DO NOT wrap.
    [RAQIV2SpecialLayoutType.RowLayout]: {
      item: true,
      container: true,
      direction: 'row',
      XSmall: 12,
      spacing: 2,
    },
    // TwoPerRowLayout: same container shape as RowLayout, but items are
    // forced to 50% width each (see GenericAnalyticsLayoutItem) so any items
    // beyond two WRAP onto subsequent rows. Use this when you want a
    // predictable two-column grid rather than a single packed row. Items become
    // full-width on compact screens only when the config opts in via
    // `stackOnCompact`; the container props here are unaffected either way.
    [RAQIV2SpecialLayoutType.TwoPerRowLayout]: {
      item: true,
      container: true,
      direction: 'row',
      XSmall: 12,
      spacing: 2,
    },
    [RAQIV2SpecialLayoutType.DropdownSelectorLayout]: {
      item: true,
      XSmall: 12,
    },
    [RAQIV2SpecialLayoutType.SectionTitle]: {
      item: true,
      container: true,
      XSmall: 12,
      // NOTE(lucaswang, 2025-10-30): This is a workaround to ensure the section title is always rendered on top of the charts.
      // Due to MUI Grid layout having having a vertical offset above the 'visual' content, it's possible the section title's description is 'blocked' by subsequent components.
      // As a result, any links rendered in the description may not be clickable.
      // https://devforum.roblox.com/t/link-to-data-stores-manager-on-data-stores-analytics-page-is-not-clickable/4032616
      zIndex: 1,
    },
  };

const computeRAQIV2SpecialLayoutGridContainerStylingOverride = (
  layoutType: RAQIV2SpecialLayoutType,
  config: RAQIV2SpecialLayoutConfig<AnalyticsComponentConfig>,
) => {
  return {
    ...SpecialLayoutTypeGridContainerProps[layoutType],
    ...config.stylingOverride,
  };
};
export default computeRAQIV2SpecialLayoutGridContainerStylingOverride;
