import { Grid } from '@rbx/ui';
import React, { FunctionComponent } from 'react';
import RewardsHeroUnit from './components/RewardsHeroUnit';
import CreatorRewardsBody from './components/CreatorRewardsBody';
import useCreatorRewardsLandingStyles from './CreatorRewardsLanding.styles';
import EarningsInfographic from './components/EarningsInfographic';
import RewardsCtaSection from './components/RewardsCtaSection';

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
