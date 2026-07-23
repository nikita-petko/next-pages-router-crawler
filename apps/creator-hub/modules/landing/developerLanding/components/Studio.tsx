import type { FunctionComponent } from 'react';
import React from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { makeStyles } from '@rbx/ui';
import { useStudio } from '@modules/miscellaneous/hooks';
import { studio, creatorHub } from '@modules/miscellaneous/urls';
import { studioVideoThumbnailImage } from '../constants/assetConstants';
import { studioConstants } from '../constants/contentConstants';
import { captureDeveloperLandingEvent, EDeveloperLandingSection } from '../utils/eventUtils';
import Section from './common/Section';
import TileCard from './common/TileCard';

const BORDER_SIZE = 2;
const useStyles = makeStyles()((theme) => ({
  cardContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: 'repeat(3, 1fr)',
    [theme.breakpoints.up('Large')]: {
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(1, 1fr)',
    },
    gap: 20,
    paddingTop: 20,
    width: '100%',
  },
  cardRoot: {
    border: `${BORDER_SIZE}px solid transparent`,
    width: '100%',
  },
  downloadButton: {
    marginTop: -20,
    marginBottom: 50,
    zIndex: 1,
    [theme.breakpoints.up('Large')]: {
      marginTop: -70,
    },
  },
  videoContainer: {
    width: '100%',
    height: 'auto',
    position: 'relative',
    paddingTop: '68%',
    '& > img': {
      ...theme.border.radius.medium,
      position: 'absolute',
      left: 0,
      top: 0,
      height: '100%',
      width: '100%',
      objectFit: 'cover',
      border: 'none',
    },
  },
}));

const Studio: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    classes: { cardContainer, cardRoot, videoContainer, downloadButton },
  } = useStyles();
  const { translate, translateWithNamespace } = useTranslation();
  const { isCompatible } = useStudio();

  const studioDownloadUrl = isCompatible
    ? (studio.getDownloadUrl() ?? '')
    : creatorHub.docs.getSettingUpStudioUrl();

  return (
    <Section
      title={translate('Heading.RobloxStudio')}
      backgroundVariant='tall'
      section={EDeveloperLandingSection.Studio}>
      <Button
        as='a'
        href={studioDownloadUrl}
        target='_blank'
        variant='Standard'
        size='Large'
        icon='icon-filled-studio'
        className={downloadButton}
        onClick={() =>
          captureDeveloperLandingEvent('clickDownloadStudio', EDeveloperLandingSection.Studio)
        }>
        {translateWithNamespace('CreatorDashboard.Landing', 'Action.StartCreatingWithStudio')}
      </Button>
      <div className={videoContainer}>
        <img
          src={studioVideoThumbnailImage}
          alt={translate('Heading.RobloxStudio')}
          loading='lazy'
        />
      </div>
      <div className={cardContainer}>
        {studioConstants.map(({ title, description }) => (
          <TileCard
            classes={{ root: cardRoot }}
            key={title}
            title={translate(title)}
            description={translate(description)}
          />
        ))}
      </div>
    </Section>
  );
};
export default Studio;
