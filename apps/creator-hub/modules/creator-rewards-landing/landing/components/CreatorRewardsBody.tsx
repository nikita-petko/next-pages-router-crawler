import { Button, Grid, Link, Typography, useMediaQuery } from '@rbx/ui';
import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import useCreatorRewardsBodyStyles from './CreatorRewardsBody.styles';

const CreatorRewardsBody: FunctionComponent = () => {
  const { translate } = useTranslation();

  const content = [
    {
      key: 'engage',
      heading: translate('Heading.EngageAndEarn'),
      body: translate('Description.EngageAndEarn', { lineBreak: '\n\n' }),
      imgSrc: `${process.env.assetPathPrefix}/creatorRewardsLanding/02_daily_rewards.png`,
      link: '/docs/creator-rewards#daily-engagement-rewards',
    },
    {
      key: 'grow',
      heading: translate('Heading.GrowCommunity'),
      body: translate('Description.GrowCommunity', { lineBreak: '\n\n' }),
      imgSrc: `${process.env.assetPathPrefix}/creatorRewardsLanding/03_community.png`,
      link: '/docs/creator-rewards#audience-expansion-rewards',
    },
    {
      key: 'influencer',
      heading: translate('Heading.InfluencerRewards'),
      body: translate('Description.InfluencerRewards'),
      imgSrc: `${process.env.assetPathPrefix}/creatorRewardsLanding/04_influencers.png`,
      link: 'https://influencers.roblox.com',
    },
  ];

  const buttonText = translate('Action.LearnMore');

  const { classes } = useCreatorRewardsBodyStyles();
  const inSmallViewPort = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const getFlexDirection = (index: number) => {
    if (inSmallViewPort) {
      return 'column-reverse';
    }
    return index % 2 ? 'row-reverse' : 'row';
  };

  return (
    <Grid container item className={classes.bodySectionContainer}>
      {content.map((item, index) => (
        <Grid
          key={item.key}
          className={classes.lineItemContainer}
          flexDirection={getFlexDirection(index)}>
          <Grid className={classes.container}>
            <Typography className={classes.builderExtended} variant='h1'>
              {item.heading}
            </Typography>
            <Typography>{item.body}</Typography>
            <Link href={item.link}>
              <Button variant='contained' color='secondary' size='small' className={classes.button}>
                {buttonText}
              </Button>
            </Link>
          </Grid>
          <img className={`${classes.container} ${classes.image}`} alt='' src={item.imgSrc} />
        </Grid>
      ))}
    </Grid>
  );
};

export default CreatorRewardsBody;
