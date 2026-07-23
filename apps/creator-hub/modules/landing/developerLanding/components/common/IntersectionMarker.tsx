import { makeStyles } from '@rbx/ui';
import React, { forwardRef } from 'react';

type TIntersectionMarkerProps = { classes: Partial<{ root: string }> };

const useStyles = makeStyles()(() => ({
  intersectionMarker: {
    height: 1,
    width: 1,
    border: 0,
    pointerEvents: 'none',
    zIndex: -1,
    opacity: 0,
    position: 'absolute',
    left: '50%',
  },
}));

const IntersectionMarker = forwardRef<HTMLDivElement, TIntersectionMarkerProps>(
  ({ classes }, ref) => {
    const {
      classes: { intersectionMarker },

      cx,
    } = useStyles();
    return <div ref={ref} className={cx(intersectionMarker, classes?.root)} role='none' />;
  },
);

IntersectionMarker.displayName = 'IntersectionMarker';
export default IntersectionMarker;
