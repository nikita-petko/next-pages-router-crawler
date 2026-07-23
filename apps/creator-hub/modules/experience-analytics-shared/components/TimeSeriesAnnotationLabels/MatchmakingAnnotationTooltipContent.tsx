import React, { forwardRef } from 'react';
import { makeStyles, TIconProps, TuneIcon } from '@rbx/ui';

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
    <React.Fragment>
      <TuneIcon {...props} ref={ref} />
      <div className={cx(enrollmentIcon, matchmakingTuneIcon)} />
    </React.Fragment>
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
    <React.Fragment>
      <TuneIcon {...props} ref={ref} />
      <div className={cx(unenrollmentIcon, matchmakingTuneIcon)} />
    </React.Fragment>
  );
};

export const EnrollmentIcon = forwardRef(ForwardedEnrollmentIcon);
export const UnenrollmentIcon = forwardRef(ForwardedUnenrollmentIcon);
