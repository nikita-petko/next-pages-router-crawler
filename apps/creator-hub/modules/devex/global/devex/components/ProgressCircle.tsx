import type { FunctionComponent } from 'react';
import React from 'react';
import { Grid, CircularProgress, Typography } from '@rbx/ui';
import useProgressCircleStyles from './ProgressCircle.styles';

interface ProgressCircleProps {
  progress: number;
  showRing: boolean;
}

const ProgressCircle: FunctionComponent<React.PropsWithChildren<ProgressCircleProps>> = ({
  progress,
  showRing,
}) => {
  const {
    classes: { root, circle, textContainer },
  } = useProgressCircleStyles();

  return (
    <Grid item className={root}>
      <CircularProgress
        value={showRing ? progress : 0}
        variant='determinate'
        size={55}
        className={circle}
        thickness={2}
      />
      <Grid item className={textContainer}>
        <Typography variant='overline'>{`${progress}%`}</Typography>
      </Grid>
    </Grid>
  );
};

export default ProgressCircle;
