import type { FunctionComponent } from 'react';
import React from 'react';
import { Grid } from '@rbx/ui';
import CreatorRewardsBody from './components/CreatorRewardsBody';
import EarningsInfographic from './components/EarningsInfographic';
import RewardsCtaSection from './components/RewardsCtaSection';
import RewardsHeroUnit from './components/RewardsHeroUnit';
import useCreatorRewardsLandingStyles from './CreatorRewardsLanding.styles';

const CreatorRewardsLanding: FunctionComponent = () => {
  const { classes } = useCreatorRewardsLandingStyles();

  return (
    <span className={classes.rewardsLandingPageContainer}>
      <Grid className={classes.rewardsLandingPage}>
        <RewardsHeroUnit />
        <CreatorRewardsBody />
        <EarningsInfographic />
        <RewardsCtaSection />
      </Grid>
    </span>
  );
};

export default CreatorRewardsLanding;
