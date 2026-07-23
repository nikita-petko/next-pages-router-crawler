import type { FC } from 'react';
import React from 'react';
import { Grid, Typography } from '@rbx/ui';
import type { MetricValueSpec } from '@modules/charts-generic/components/MetricValue/MetricValue';
import MetricValue from '@modules/charts-generic/components/MetricValue/MetricValue';
import type { TMetricsTileStyleConfig } from '../../constants/tileConstants';

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
