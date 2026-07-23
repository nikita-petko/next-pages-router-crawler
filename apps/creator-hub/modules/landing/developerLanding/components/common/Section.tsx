import type { FunctionComponent } from 'react';
import React, { useRef } from 'react';
import { makeStyles, Typography } from '@rbx/ui';
import Flex from '@modules/miscellaneous/components/Flex';
import {
  waveBackgroundShortVideoSources,
  waveBackgroundShortImage,
  waveBackgroundTallImage,
  waveBackgroundTallVideoSources,
} from '../../constants/assetConstants';
import type { EDeveloperLandingSection } from '../../utils/eventUtils';
import { DEVELOPER_LANDING_PAGE_IMPRESSION_THRESHOLD } from '../../utils/eventUtils';
import useDeveloperLandingSectionImpression from '../../utils/useDeveloperLandingSectionImpression';
import IntersectionMarker from './IntersectionMarker';
import LazyLoadedVideo from './LazyLoadedVideo';

const useStyles = makeStyles()((theme) => ({
  heading: {
    zIndex: 1,
    fontSize: '60px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '110%',
    maxWidth: 900,
    width: '100%',
    [theme.breakpoints.down('Large')]: {
      fontSize: '48px',
    },
    [theme.breakpoints.down('Medium')]: {
      maxWidth: 350,
      fontSize: '30px',
    },
  },
  withDescription: {
    paddingBottom: 45,
    [theme.breakpoints.down('Large')]: {
      paddingBottom: 35,
    },
  },
  withoutDescription: {
    paddingBottom: 100,
    [theme.breakpoints.down('Large')]: {
      paddingBottom: 50,
    },
  },
  description: {
    zIndex: 1,
    maxWidth: 900,
    fontWeight: 300,
    paddingBottom: 80,
    [theme.breakpoints.down('Large')]: {
      paddingBottom: 35,
    },
    [theme.breakpoints.down('Medium')]: {
      ...theme.typography.body1,
    },
  },
  sectionContent: { position: 'relative', width: '100%' },
  section: {
    paddingTop: 250,
    alignSelf: 'center',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: 1200,
    [theme.breakpoints.down('XLarge')]: {
      maxWidth: 800,
    },
    [theme.breakpoints.down('Large')]: {
      paddingTop: 130,
      maxWidth: 540,
    },
    [theme.breakpoints.down('Medium')]: {
      maxWidth: 353,
    },
  },
  content: {
    zIndex: 1,
    width: '100%',
    maxWidth: 1200,
  },
  videoContainer: {
    width: '100vw',
    position: 'absolute',
    top: 0,
    transform: 'translateY(-25%)',
    '& > video': {
      width: '100%',
    },
  },
  impressionMarker: {
    top: `${DEVELOPER_LANDING_PAGE_IMPRESSION_THRESHOLD * 100}%`,
  },
}));

type TSectionProps = {
  title: string;
  description?: string;
  backgroundVariant?: 'short' | 'tall';
  classes?: Partial<{ root: string }>;
  section: EDeveloperLandingSection;
};

const Section: FunctionComponent<React.PropsWithChildren<TSectionProps>> = ({
  title,
  description,
  backgroundVariant,
  children,
  classes,
  section: eventSectionName,
}) => {
  const {
    classes: {
      section,
      sectionContent,
      heading,
      withDescription,
      withoutDescription,
      description: descriptionRoot,
      content,
      videoContainer,
      impressionMarker,
    },

    cx,
  } = useStyles();

  const impressionMarkerRef = useRef<HTMLDivElement>(null);
  useDeveloperLandingSectionImpression(impressionMarkerRef, eventSectionName);

  const backgroundVideoSources = {
    short: {
      src: waveBackgroundShortVideoSources,
      poster: waveBackgroundShortImage,
    },
    tall: {
      src: waveBackgroundTallVideoSources,
      poster: waveBackgroundTallImage,
    },
  };

  return (
    <div className={cx(section, classes?.root)}>
      {backgroundVariant && (
        <div className={videoContainer}>
          <LazyLoadedVideo
            src={backgroundVideoSources[backgroundVariant].src}
            poster={backgroundVideoSources[backgroundVariant].poster}
          />
        </div>
      )}
      <Flex flexDirection='column' alignItems='center' classes={{ root: sectionContent }}>
        <IntersectionMarker ref={impressionMarkerRef} classes={{ root: impressionMarker }} />
        <Typography
          classes={{
            root: cx(heading, {
              [withDescription]: description !== undefined,
              [withoutDescription]: description === undefined,
            }),
          }}
          variant='h2'
          component='h2'
          align='center'>
          {title}
        </Typography>
        <Flex classes={{ root: content }} flexDirection='column' alignItems='center'>
          {description && (
            <Typography
              variant='h4'
              color='secondary'
              classes={{ root: descriptionRoot }}
              align='center'>
              {description}
            </Typography>
          )}
          {children}
        </Flex>
      </Flex>
    </div>
  );
};

export default Section;
