import { Grid, Typography } from '@rbx/ui';
import React, { FC } from 'react';
import { TMetricsTileStyleConfig } from '../../constants/tileConstants';
import MetricValueRow, { MetricValueRowSpec } from './MetricValueRow';

type MetricValueSpec = Omit<MetricValueRowSpec, 'styleConfig'> & {
  metricKey: string;
};

type AnalyticsMetricsOverviewSpec = {
  metrics: MetricValueSpec[];
  metricsHeader?: React.ReactNode;
  valuesHeader?: React.ReactNode;
  styleConfig: TMetricsTileStyleConfig;
};

const AnalyticsMetricsOverview: FC<AnalyticsMetricsOverviewSpec> = ({
  metrics,
  metricsHeader,
  valuesHeader,
  styleConfig,
}) => {
  const rows = metrics.map((metricValue) => (
    <Grid item key={metricValue.metricKey} data-testid={metricValue.metricKey}>
      <MetricValueRow {...metricValue} styleConfig={styleConfig} />
    </Grid>
  ));

  return (
    <Grid container direction='column' spacing={styleConfig.metricsLayoutSpacing}>
      {metricsHeader && valuesHeader && (
        <Grid item>
          <Grid container direction='row' justifyContent='space-between'>
            <Grid item>
              <Typography variant='footer' color='secondary'>
                {metricsHeader}
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant='footer' color='secondary'>
                {valuesHeader}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      )}
      {rows}
    </Grid>
  );
};

export default AnalyticsMetricsOverview;
