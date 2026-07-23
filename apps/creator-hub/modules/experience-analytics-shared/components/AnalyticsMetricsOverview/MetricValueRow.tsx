import React, { FC } from 'react';
import { Grid, Typography } from '@rbx/ui';
import { MetricValue, MetricValueSpec } from '@modules/charts-generic';
import { TMetricsTileStyleConfig } from '../../constants/tileConstants';

export type MetricValueRowSpec = {
  metricTitle: React.ReactNode;
  value: MetricValueSpec;
  styleConfig: TMetricsTileStyleConfig;
};

const MetricValueRow: FC<MetricValueRowSpec> = ({ metricTitle, value, styleConfig }) => {
  return (
    <Grid container direction='row' justifyContent='space-between' wrap='nowrap'>
      <Grid item>
        <Typography variant={styleConfig.metricsTypographyVariant}>{metricTitle}</Typography>
      </Grid>
      <Grid item>
        <MetricValue
          {...value}
          typographySpec={{ variant: styleConfig.metricsValueTypographyVariant }}
        />
      </Grid>
    </Grid>
  );
};

export default MetricValueRow;
