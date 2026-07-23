import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Grid, Link, Typography } from '@rbx/ui';
import LazyLoadedVideo from './LazyLoadedVideo';
import useRewardsCtaSectionStyles from './RewardsCtaSection.styles';

const RewardsCtaSection: FunctionComponent = () => {
  const { classes } = useRewardsCtaSectionStyles();
  const { translate } = useTranslation();

  return (
    <Grid className={classes.container}>
      <Grid className={classes.ctaSectionContainer}>
        <Typography variant='hero' className={classes.ctaSectionHeading}>
          {translate('Heading.ReadyToDive', { linkStart: '', linkEnd: '' })}
        </Typography>
        <Link href='/docs/creator-rewards'>
          <Button
            variant='contained'
            color='primaryBrand'
            size='large'
            className={classes.ctaButton}>
            {translate('Action.LearnMore')}
          </Button>
        </Link>
      </Grid>
      <div className={classes.videoContainer}>
        <LazyLoadedVideo
          classes={{ root: classes.video }}
          src={[
            {
              url: `${process.env.assetPathPrefix}/creatorRewardsLanding/07_cubes.mp4`,
              type: 'video/mp4',
            },
          ]}
          poster={`${process.env.assetPathPrefix}/creatorRewardsLanding/roblox_background.webp`}
        />
      </div>
    </Grid>
  );
};

export default RewardsCtaSection;
