import React from 'react';
import { Grid, useMediaQuery } from '@rbx/ui';
import type { ExperienceAnalyticsPageControl } from './ExperienceAnalyticsPageControlBar';

type ExperienceAnalyticsRAQIV2RightSideControlsProps = {
  controls: Array<ExperienceAnalyticsPageControl>;
};

const ExperienceAnalyticsRAQIV2RightSideControls = ({
  controls,
}: ExperienceAnalyticsRAQIV2RightSideControlsProps) => {
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  if (!controls.length) {
    return null;
  }

  return (
    <Grid
      container
      direction={isCompactView ? 'column' : 'row'}
      alignItems={isCompactView ? 'left' : 'center'}
      justifyContent={isCompactView ? 'flex-start' : 'flex-end'}
      paddingTop='16px'>
      {controls}
    </Grid>
  );
};

export default ExperienceAnalyticsRAQIV2RightSideControls;
