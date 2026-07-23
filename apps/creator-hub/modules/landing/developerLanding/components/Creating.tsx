import { makeStyles, Button, StudioIcon, Typography, Link } from '@rbx/ui';
import React, { FunctionComponent, useRef } from 'react';
import { useTranslation } from '@rbx/intl';
import { useStudio } from '@modules/miscellaneous/hooks';
import { components, urls } from '@modules/miscellaneous/common';
import LazyLoadedVideo from './common/LazyLoadedVideo';
import { robloxBackgroundVideoSources, robloxBackgroundImage } from '../constants/assetConstants';
import useDeveloperLandingSectionImpression from '../utils/useDeveloperLandingSectionImpression';
import { EDeveloperLandingSection, captureDeveloperLandingEvent } from '../utils/eventUtils';
import { developerLandingLinkActionColor } from './common/Card';

const { Flex } = components;
const { studio, creatorHub } = urls;
const useStyles = makeStyles()((theme) => ({
  container: {
    position: 'relative',
    padding: '220px 0',
    [theme.breakpoints.down('Large')]: {
      paddingBottom: '130px 0',
    },
  },
  heading: {
    zIndex: 1,
    fontSize: '60px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '110%',
    width: '100%',
    paddingBottom: 35,
    [theme.breakpoints.down('Large')]: {
      maxWidth: 500,
      fontSize: '30px',
    },
    [theme.breakpoints.down('Medium')]: {
      maxWidth: 350,
    },
  },
  description: {
    zIndex: 1,
    maxWidth: 900,
    fontWeight: 300,
    paddingBottom: 60,
    [theme.breakpoints.down('XLarge')]: {
      maxWidth: 800,
    },
    [theme.breakpoints.down('Large')]: {
      maxWidth: 540,
    },
    [theme.breakpoints.down('Medium')]: {
      ...theme.typography.body1,
      maxWidth: 353,
    },
  },
  videoContainer: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    // to have the cards pass underneath of the cards in the above section
    top: -20,
    '& > video': {
      height: '100%',
      width: '100%',
      objectFit: 'cover',
    },
  },
  linkText: {
    color: developerLandingLinkActionColor,
  },
}));

const Creating: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const {
    classes: { container, heading, videoContainer, description, linkText },
  } = useStyles();
  const studioDownloadURL = studio.getDownloadUrl();
  const { translate, translateHTML } = useTranslation();
  const { isCompatible } = useStudio();

  const startCreatingButtonRef = useRef<HTMLAnchorElement>(null);
  useDeveloperLandingSectionImpression(
    startCreatingButtonRef,
    EDeveloperLandingSection.StartCreating,
  );

  return (
    <Flex classes={{ root: container }} flexDirection='column' alignItems='center'>
      <div className={videoContainer}>
        <LazyLoadedVideo src={robloxBackgroundVideoSources} poster={robloxBackgroundImage} />
      </div>
      <Typography textAlign='center' component='h2' variant='h2' classes={{ root: heading }}>
        {translate('Heading.Creating')}
      </Typography>
      <Typography
        textAlign='center'
        component='h4'
        variant='h4'
        color='secondary'
        classes={{ root: description }}>
        {translateHTML('Description.Creating', [
          {
            opening: 'unityLinkStart',
            closing: 'unityLinkEnd',
            content(chunks) {
              return (
                <Link
                  className={linkText}
                  href={creatorHub.docs.getUnityGuideUrl()}
                  onClick={() =>
                    captureDeveloperLandingEvent(
                      'clickUnityGuideLink',
                      EDeveloperLandingSection.StartCreating,
                    )
                  }>
                  {chunks}
                </Link>
              );
            },
          },
          {
            opening: 'unrealLinkStart',
            closing: 'unrealLinkEnd',
            content(chunks) {
              return (
                <Link
                  className={linkText}
                  href={creatorHub.docs.getUnrealGuideUrl()}
                  onClick={() =>
                    captureDeveloperLandingEvent(
                      'clickUnrealGuideLink',
                      EDeveloperLandingSection.StartCreating,
                    )
                  }>
                  {chunks}
                </Link>
              );
            },
          },
        ])}
      </Typography>
      <Button
        component='a'
        href={isCompatible ? (studioDownloadURL ?? '') : creatorHub.docs.getSettingUpStudioUrl()}
        target='_blank'
        startIcon={<StudioIcon />}
        variant='contained'
        color='primary'
        ref={startCreatingButtonRef}
        onClick={() =>
          captureDeveloperLandingEvent(
            'clickDownloadStudio',
            EDeveloperLandingSection.StartCreating,
          )
        }>
        {translate('Action.DownloadStudio')}
      </Button>
    </Flex>
  );
};
export default Creating;
