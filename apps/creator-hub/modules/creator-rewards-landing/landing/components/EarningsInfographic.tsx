import { Button, Grid, Link, Typography } from '@rbx/ui';
import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { useRouter } from 'next/router';
import LazyLoadedVideo from './LazyLoadedVideo';
import useEarningsInfographicStyles from './EarningsInfographic.styles';

const EarningsInfographic: FunctionComponent = () => {
  const { classes } = useEarningsInfographicStyles();
  const { translate, translateHTML } = useTranslation();
  const router = useRouter();

  const content = [
    {
      key: 'engage',
      heading: translate('Heading.DailyEngagement'),
      body: translate('Description.DailyEngagement'),
      link: '/docs/creator-rewards#for-experiences',
    },
    {
      key: 'grow',
      heading: translate('Heading.AudienceExpansion'),
      body: translate('Description.AudienceExpansion'),
      link: '/docs/creator-rewards#for-experiences',
    },
    {
      key: 'links',
      heading: translate('Heading.ShareLinkAnalytics'),
      body: translate('Description.ShareLinkAnalytics'),
      link: '/docs/creator-rewards#for-share-links',
    },
  ];

  return (
    <Grid className={classes.container}>
      <Typography variant='hero' className={classes.heroText}>
        {translate('Title.ActionableInsights')}
      </Typography>
      <Typography>
        {translateHTML('Description.ActionableInsights', [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content(chunks) {
              return (
                <Link href='/docs/production/analytics' target='_blank'>
                  {chunks}
                </Link>
              );
            },
          },
        ])}
      </Typography>
      <div className={classes.videoContainer}>
        <LazyLoadedVideo
          classes={{ root: classes.videoItem }}
          src={[
            {
              url: `${process.env.assetPathPrefix}/creatorRewardsLanding/05_chart_lines.mp4`,
              type: 'video/mp4',
            },
          ]}
          poster={`${process.env.assetPathPrefix}/creatorRewardsLanding/roblox_background.webp`}
        />
        <img
          className={classes.videoBackground}
          alt=''
          src={`${process.env.assetPathPrefix}/creatorRewardsLanding/06_chart.png`}
        />
      </div>
      <Grid container className={classes.infoContainer}>
        {content.map((section) => (
          <Grid key={section.key} item className={classes.infoItem}>
            <Typography className={classes.builderExtended} variant='h1'>
              {section.heading}
            </Typography>
            <Typography>{section.body}</Typography>
            <Link href={section.link}>
              <Button
                variant='contained'
                color='secondary'
                size='small'
                className={classes.ctaButton}
                onClick={() => router.push(section.link)}>
                {translate('Action.LearnMore')}
              </Button>
            </Link>
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
};

export default EarningsInfographic;
