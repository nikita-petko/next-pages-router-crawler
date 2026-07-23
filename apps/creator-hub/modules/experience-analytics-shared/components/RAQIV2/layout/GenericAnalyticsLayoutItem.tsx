import type { FC } from 'react';
import React, { useMemo } from 'react';
import type { TGridProps } from '@rbx/ui';
import { Grid } from '@rbx/ui';
import { RAQIV2SpecialLayoutType } from '../../../types/RAQIV2SpecialLayoutConfig';

type GenericAnalyticsLayoutItemProps = {
  layout?: RAQIV2SpecialLayoutType;
  // Per-instance overrides merged over the layout's static grid item props.
  // Used by layouts whose sizing is opt-in (e.g. TwoPerRowLayout's
  // `stackOnCompact`) and therefore cannot be expressed by the static map.
  gridPropsOverride?: TGridProps;
};

const SpecialLayoutTypeToProps: Record<RAQIV2SpecialLayoutType, TGridProps> = {
  [RAQIV2SpecialLayoutType.ResponsiveOneOrTwoColumnLayout]: {
    XSmall: 12,
    XLarge: 6,
  },
  [RAQIV2SpecialLayoutType.FullWidthLayout]: {
    XSmall: 12,
  },
  [RAQIV2SpecialLayoutType.VerticalPriorityLayout]: {
    XSmall: 12,
    Large: 6,
    container: true,
    spacing: '24px',
  },
  // RowLayout items: no breakpoint sizing — each item shrinks to its
  // intrinsic content width and items sit side-by-side without wrapping.
  // Pair with `RowLayout`'s container props (which provide `spacing`/gap).
  [RAQIV2SpecialLayoutType.RowLayout]: {},
  // TwoPerRowLayout items: by default exactly half the container width
  // (`XSmall: 6` = 6/12 columns at every breakpoint), so two items fit per
  // row and a third item wraps onto a new row. Opting into responsiveness via
  // the config's `stackOnCompact` flag overrides these props per-instance (see
  // `TwoPerRowLayoutComponent`). Contrast with RowLayout's `{}` (intrinsic
  // width, no wrap).
  [RAQIV2SpecialLayoutType.TwoPerRowLayout]: {
    XSmall: 6,
  },
  [RAQIV2SpecialLayoutType.DropdownSelectorLayout]: {
    XSmall: 12,
  },
  [RAQIV2SpecialLayoutType.SectionTitle]: {
    XSmall: 12,
  },
};

/**
 * The DEFAULT behaviour when no RAQIV2SpecialLayoutType is specified is to arrange components into a
 * responsive one- or two-column layout based on the page width (i.e. ResponsiveOneOrTwoColumnLayout).
 */
const GenericAnalyticsLayoutItem: FC<React.PropsWithChildren<GenericAnalyticsLayoutItemProps>> = ({
  children,
  layout = RAQIV2SpecialLayoutType.ResponsiveOneOrTwoColumnLayout,
  gridPropsOverride,
}) => {
  const baseProps = useMemo(() => {
    return { ...SpecialLayoutTypeToProps[layout], ...gridPropsOverride };
  }, [layout, gridPropsOverride]);

  return (
    <Grid item {...baseProps}>
      {children}
    </Grid>
  );
};
export default GenericAnalyticsLayoutItem;
