import { makeStyles, useMediaQuery } from '@rbx/ui';
import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import Section from './common/Section';
import { studioConstants } from '../constants/contentConstants';
import TileCard from './common/TileCard';
import LazyLoadedVideo from './common/LazyLoadedVideo';
import { EDeveloperLandingSection } from '../utils/eventUtils';
import {
  studioPosterImage,
  studioSquarePosterImage,
  studioVideoSources,
  studioVideoSquareSources,
} from '../constants/assetConstants';

const BORDER_SIZE = 2;
const useStyles = makeStyles()((theme) => ({
  cardContainer: {
    display: 'grid',

    gridTemplateColumns: '1fr',
    gridTemplateRows: 'repeat(3, 1fr)',
    [theme.breakpoints.up('Large')]: {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gridTemplateRows: 'repeat(2, 1fr)',
    },
    [theme.breakpoints.up('XLarge')]: {
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
    [theme.breakpoints.up('Large')]: {
      minWidth: 353,
    },
  },
  videoContainer: {
    width: '100%',
    position: 'relative',
    aspectRatio: '16 / 9',
    '& > video': {
      ...theme.border.radius.medium,
      width: '100%',
      objectFit: 'fill',
    },
    '& > img': {
      ...theme.border.radius.medium,
      width: '100%',
      objectFit: 'fill',
    },
    [theme.breakpoints.down('Large')]: {
      aspectRatio: '1 / 1',
    },
  },
}));

const Studio: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const {
    classes: { cardContainer, cardRoot, videoContainer },
  } = useStyles();
  const { translate } = useTranslation();

  const isSquareVideo = useMediaQuery((theme) => theme.breakpoints.down('Large'));

  return (
    <Section
      title={translate('Heading.RobloxStudio')}
      backgroundVariant='tall'
      section={EDeveloperLandingSection.Studio}>
      <div className={videoContainer}>
        {isSquareVideo ? (
          <LazyLoadedVideo src={studioVideoSquareSources} poster={studioSquarePosterImage} />
        ) : (
          <LazyLoadedVideo src={studioVideoSources} poster={studioPosterImage} />
        )}
      </div>
      <div className={cardContainer}>
        {studioConstants.map(({ IconComponent, title, description }) => (
          <TileCard
            classes={{ root: cardRoot }}
            key={title}
            title={translate(title)}
            description={translate(description)}
            IconComponent={IconComponent}
          />
        ))}
      </div>
    </Section>
  );
};
export default Studio;
