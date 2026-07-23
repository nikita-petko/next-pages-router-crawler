import React, { forwardRef } from 'react';
import type { TIconProps } from '@rbx/ui';
import { makeStyles, TuneIcon } from '@rbx/ui';

const useStyles = makeStyles()((theme) => ({
  matchmakingTuneIcon: {
    position: 'absolute',
    top: '70%',
    left: '70%',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
  },
  enrollmentIcon: {
    backgroundColor: theme.palette.actionV2.active.fill,
  },
  unenrollmentIcon: {
    backgroundColor: theme.palette.actionV2.important.fill,
  },
}));

const ForwardedEnrollmentIcon: React.ForwardRefRenderFunction<SVGSVGElement, TIconProps> = (
  props,
  ref,
) => {
  const {
    classes: { matchmakingTuneIcon, enrollmentIcon },
    cx,
  } = useStyles();
  return (
    <>
      <TuneIcon {...props} ref={ref} />
      <div className={cx(enrollmentIcon, matchmakingTuneIcon)} />
    </>
  );
};

const ForwardedUnenrollmentIcon: React.ForwardRefRenderFunction<SVGSVGElement, TIconProps> = (
  props,
  ref,
) => {
  const {
    classes: { matchmakingTuneIcon, unenrollmentIcon },
    cx,
  } = useStyles();
  return (
    <>
      <TuneIcon {...props} ref={ref} />
      <div className={cx(unenrollmentIcon, matchmakingTuneIcon)} />
    </>
  );
};

export const EnrollmentIcon = forwardRef(ForwardedEnrollmentIcon);
export const UnenrollmentIcon = forwardRef(ForwardedUnenrollmentIcon);
