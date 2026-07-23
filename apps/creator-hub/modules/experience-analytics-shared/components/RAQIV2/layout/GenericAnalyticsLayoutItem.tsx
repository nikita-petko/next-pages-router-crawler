import { Grid, TGridProps } from '@rbx/ui';
import React, { FC, useMemo } from 'react';
import { RAQIV2SpecialLayoutType } from '../../../types/RAQIV2SpecialLayoutConfig';

type GenericAnalyticsLayoutItemProps = {
  layout?: RAQIV2SpecialLayoutType;
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
  [RAQIV2SpecialLayoutType.RowLayout]: {
    style: {
      flex: '1 1 0',
      minWidth: 0,
    },
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
}) => {
  const baseProps = useMemo(() => {
    return SpecialLayoutTypeToProps[layout];
  }, [layout]);

  return (
    <Grid item {...baseProps}>
      {children}
    </Grid>
  );
};
export default GenericAnalyticsLayoutItem;
