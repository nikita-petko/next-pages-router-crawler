import React, { FunctionComponent } from 'react';
import { Typography, Grid } from '@rbx/ui';
import { numberFormatter as localizeNumberString } from '@rbx/core';
import useOverviewStatsStyles from './OverviewStats.styles';

export interface OverviewStatsProps {
  statistic: number;
  statLabelName: string;
  options?: 'currency' | 'percent' | 'decimal';
  withAnalytics?: boolean;
}

const OverviewStats: FunctionComponent<React.PropsWithChildren<OverviewStatsProps>> = ({
  statistic,
  statLabelName,
  options,
  withAnalytics,
}) => {
  const {
    classes: { overviewStatContainer, overviewStatValue },
  } = useOverviewStatsStyles();

  return (
    <Grid className={overviewStatContainer} container alignItems='baseline' wrap='nowrap'>
      <Typography
        className={overviewStatValue}
        align='center'
        variant={withAnalytics ? 'h4' : 'h3'}>
        {localizeNumberString(statistic, options)}
      </Typography>
      <Typography align='center' color='secondary' variant='smallLabel2'>
        {statLabelName}
      </Typography>
    </Grid>
  );
};

export default OverviewStats;
