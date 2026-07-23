import type { FunctionComponent } from 'react';
import React from 'react';
import { getFormattedDate } from '@rbx/core';
import { Typography, Grid, Paper } from '@rbx/ui';
import useOverviewTimeLabelStyles from './OverviewTimeLabel.styles';

export interface OverviewTimeLabelProps {
  date: Date;
  heading: string;
}

const OverviewTimeLabel: FunctionComponent<React.PropsWithChildren<OverviewTimeLabelProps>> = ({
  date,
  heading,
}) => {
  const {
    classes: { background, overviewLabel },
  } = useOverviewTimeLabelStyles();

  return (
    <Grid item XSmall={12} Medium={6}>
      <Paper className={background}>
        <Grid container direction='column'>
          <Typography align='center' variant='overline' color='secondary'>
            {heading}
          </Typography>
          <Typography className={overviewLabel} align='center' variant='h3'>
            {getFormattedDate(date)}
          </Typography>
        </Grid>
      </Paper>
    </Grid>
  );
};

export default OverviewTimeLabel;
