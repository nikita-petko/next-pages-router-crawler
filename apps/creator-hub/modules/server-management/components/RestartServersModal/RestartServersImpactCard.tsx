import type { FunctionComponent } from 'react';
import React from 'react';
import { Card, Grid, Typography } from '@rbx/ui';
import useRestartServersImpactCardStyles from './RestartServersImpactCard.styles';

export interface RestartServersImpactCardProps {
  label: string;
  value: string;
}

const RestartServersImpactCard: FunctionComponent<RestartServersImpactCardProps> = ({
  label,
  value,
}) => {
  const { classes } = useRestartServersImpactCardStyles();

  const { impactCardContainer, impactCard, impactValue } = classes;

  return (
    <Grid item className={impactCardContainer}>
      <Card variant='outlined' className={impactCard}>
        <Typography variant='smallLabel2'>{label}</Typography>
        <Typography variant='h5' className={impactValue}>
          {value}
        </Typography>
      </Card>
    </Grid>
  );
};

export default RestartServersImpactCard;
