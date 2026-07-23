import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, CampaignIcon, CircularProgress, Grid, Link, Typography } from '@rbx/ui';
import useRoadMapTranslation from './components/hooks/useRoadMapTranslation';
import RoadMapTile from './components/RoadMapTile';
import {
  bannerLeftImg,
  bannerRightImg,
  releaseRoadmapDevForumPostUrl,
  creatorRoadmapDevForumPostUrl,
} from './constants/roadMapConstants';
import useRoadMapContainerStyles from './RoadMapContainer.styles';

export type RoadMapContainerAnalyticsProps = {
  onReadAnnouncementClick?: () => void;
  onDiscussRoadmapClick?: () => void;
};

const RoadMapContainer: FunctionComponent<
  React.PropsWithChildren<RoadMapContainerAnalyticsProps>
> = ({ onReadAnnouncementClick, onDiscussRoadmapClick }) => {
  const {
    classes: {
      container,
      accordionContainer,
      banner,
      callToAction,
      bannerImages,
      accordions,
      bannerContent,
      secondaryText,
      lastUpdated,
      disclaimer,
      iconButton,
    },
  } = useRoadMapContainerStyles();
  const { translate } = useTranslation();
  const { ready, roadMapDetails } = useRoadMapTranslation();

  return (
    <Grid classes={{ root: container }}>
      <Grid container classes={{ root: banner }}>
        <Grid className={bannerImages}>
          <img src={bannerLeftImg} alt='' />
          <img src={bannerRightImg} alt='' />
        </Grid>
        <Grid classes={{ root: bannerContent }}>
          <Typography variant='h1' component='h1' marginBottom={1}>
            {translate('Heading.CreatorRoadMap')}
          </Typography>
          <Typography color='secondary' variant='body1' classes={{ root: secondaryText }}>
            {translate('Description.CreatorRoadMap')}
          </Typography>

          {releaseRoadmapDevForumPostUrl && (
            <>
              <Link target='_blank' href={creatorRoadmapDevForumPostUrl}>
                <Button
                  variant='contained'
                  size='large'
                  className={iconButton}
                  onClick={onReadAnnouncementClick}>
                  <CampaignIcon />
                  {translate('Action.ReadAnnouncement')}
                </Button>
              </Link>
              <Typography color='secondary' variant='body2' classes={{ root: lastUpdated }}>
                {translate('Label.LastUpdated2026MayUpdate')}
              </Typography>
            </>
          )}
        </Grid>
      </Grid>
      <Grid classes={{ root: disclaimer }}>
        <Typography color='secondary' variant='body2'>
          {translate('Description.Disclaimer2025DecemberUpdate')}
        </Typography>
      </Grid>
      <Grid classes={{ root: accordions }}>
        {ready ? (
          roadMapDetails.map((sectionDetails) => (
            <Grid key={sectionDetails.title} classes={{ root: accordionContainer }}>
              <RoadMapTile {...sectionDetails} />
            </Grid>
          ))
        ) : (
          <Grid container justifyContent='center' style={{ padding: 48 }}>
            <CircularProgress />
          </Grid>
        )}
      </Grid>
      <Grid container classes={{ root: banner }}>
        <Grid classes={{ root: bannerContent }}>
          <Typography variant='h2'>{translate('Heading.JoinTheCommunity')}</Typography>
          <Typography color='secondary' variant='body1'>
            {translate('Description.JoinTheCommunity')}
          </Typography>
          <Link href='https://devforum.roblox.com'>
            <Button
              variant='contained'
              classes={{ root: callToAction }}
              onClick={onDiscussRoadmapClick}>
              {translate('Label.DiscusRoadMap')}
            </Button>
          </Link>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default RoadMapContainer;
