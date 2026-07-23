import type { FunctionComponent } from 'react';
import React, { useState, useCallback } from 'react';
import { clsx as cx } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useThemeMode } from '@rbx/settings';
import {
  Button,
  CloseIcon,
  GetAppIcon,
  IconButton,
  PlayArrowIcon,
  Typography,
  makeStyles,
} from '@rbx/ui';
import type {
  StarterPlaceParameterResults,
  StarterPlaceParameters,
} from '@modules/clients/ixpExperiments';
import { downloadStudioDirectDownloadEventModel } from '@modules/eventStream/constants/eventConstants';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { Flex, YoutubeVideo } from '@modules/miscellaneous/components';
import { useConversionTracker } from '@modules/miscellaneous/hooks';
import useStudio from '@modules/miscellaneous/hooks/useStudio';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { youtubeHash, studioLogoSvg } from '../../constants/assetConstants';
import Card from '../common/Card';
import CreatePlaceCard from './CreatePlaceCard';
import styles from './VideoOnboarding.module.css';

const AUTOPLAY_OPTIONS = { playerVars: { autoplay: 1 } } as const;

const useStyles = makeStyles()((theme) => ({
  closeIcon: {
    position: 'absolute',
    width: 40,
    height: 40,
    top: 24,
    right: 24,
  },
  closeIconPlaceCard: {
    position: 'absolute',
    width: 40,
    height: 40,
    top: 4,
    right: 4,
  },
  textContainer: {
    padding: 24,
    width: '90%',
  },
  header: {
    display: 'block',
    marginBottom: 4,
  },
  description: {
    display: 'block',
  },
  tileContainer: {
    padding: '0 24px 24px 24px',
    gap: 16,

    [theme.breakpoints.up('XXLarge')]: {
      minHeight: 360,
    },

    [theme.breakpoints.down('Medium')]: {
      gap: 12,
      flexDirection: 'column',
    },

    '& > *': {
      flex: '1 1 0',
    },
  },
  videoCard: {
    position: 'relative',
    width: '100%',
    maxWidth: 568,
    [theme.breakpoints.down('Medium')]: {
      paddingTop: '56.25%',
    },
  },
  videoCardVideo: {
    ...theme.border.radius.large,
    top: 0,
    left: 0,
    border: 'none',
    position: 'absolute',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  studioCard: {
    ...theme.border.radius.large,
    padding: '24px 48px',
    height: '100%',
    backgroundColor: theme.palette.surface[300],
    border: `1px solid ${theme.palette.components.divider}`,

    '& > div': {
      height: '100%',
    },
    '&:hover': {
      border: `1px solid ${theme.palette.components.divider}`,
    },

    [theme.breakpoints.down('Medium')]: {
      padding: '24',
    },
  },
  studioCardIcon: {
    width: 48,
    height: 48,
    marginTop: 24,
  },
  studioCardHeading: {
    marginTop: 12,
  },
  studioCardDescription: {
    marginTop: 6,
  },
  studioCardButton: {
    marginTop: 16,
    marginBottom: 24,
  },
}));

interface VideoOnboardingCardProps {
  onDismiss: () => void;
  starterPlaceTemplateId: StarterPlaceParameterResults[StarterPlaceParameters.StarterPlaceTemplateId];
  isFetchedStarterPlaceCreation: boolean;
  isCreatePlaceEnabled: boolean;
}

const VideoOnboardingCard: FunctionComponent<React.PropsWithChildren<VideoOnboardingCardProps>> = ({
  onDismiss,
  starterPlaceTemplateId,
  isFetchedStarterPlaceCreation,
  isCreatePlaceEnabled,
}) => {
  const { isCompatible, getStudioDownloadUrlAsync } = useStudio();
  const { trackerClient } = useEventTrackerProvider();
  const { translate } = useTranslation();
  const { ref, onConvert } = useConversionTracker<HTMLDivElement>('videoOnboarding');
  const [disabled, setDisabled] = useState(false);
  // Defer mounting the YouTube iframe until the user clicks play to keep home page LCP fast.
  const [isVideoMounted, setIsVideoMounted] = useState(false);
  const { themeMode } = useThemeMode();
  const shouldShowCreatePlace = !isCompatible && isCreatePlaceEnabled;

  const {
    classes: {
      textContainer,
      header,
      description,
      tileContainer,
      closeIcon,
      closeIconPlaceCard,
      videoCard,
      videoCardVideo,
      studioCard,
      studioCardIcon,
      studioCardHeading,
      studioCardDescription,
      studioCardButton,
    },
  } = useStyles();

  const onPlay = useCallback(() => {
    onConvert('playVideo');
  }, [onConvert]);

  const handleVideoActivate = useCallback(() => {
    setIsVideoMounted(true);
  }, []);

  if (!isFetchedStarterPlaceCreation) {
    return null;
  }

  if (shouldShowCreatePlace) {
    return (
      <Card ref={ref}>
        <IconButton
          onClick={() => {
            onConvert('clickOnboardingCloseIcon');
            onDismiss();
          }}
          classes={{ root: closeIconPlaceCard }}
          color='secondary'
          aria-label='close'
          size='large'>
          <CloseIcon fontSize='medium' />
        </IconButton>
        <Flex classes={{ root: tileContainer }}>
          <CreatePlaceCard starterPlaceTemplateId={starterPlaceTemplateId} onConvert={onConvert} />
        </Flex>
      </Card>
    );
  }

  return (
    <Card ref={ref}>
      <Flex>
        <div className={textContainer}>
          <Typography classes={{ root: header }} variant='h3'>
            {translate('Heading.VideoOnboarding')}
          </Typography>
          <Typography classes={{ root: description }} color='secondary' variant='body2'>
            {translate('Description.VideoOnboarding')}
          </Typography>
        </div>
      </Flex>
      <IconButton
        onClick={() => {
          onConvert('clickOnboardingCloseIcon');
          onDismiss();
        }}
        classes={{ root: closeIcon }}
        color='secondary'
        aria-label='close'
        size='large'>
        <CloseIcon fontSize='medium' />
      </IconButton>
      <Flex classes={{ root: tileContainer }}>
        <div className={videoCard}>
          {isVideoMounted ? (
            <YoutubeVideo
              videoId={youtubeHash}
              className={videoCardVideo}
              options={AUTOPLAY_OPTIONS}
              onPlay={onPlay}
            />
          ) : (
            <button
              type='button'
              onClick={handleVideoActivate}
              className={cx(
                'flex items-center justify-center cursor-pointer stroke-none padding-none',
                styles.videoPlaceholder,
                videoCardVideo,
              )}
              aria-label={translate('Description.VideoOnboarding')}>
              <span
                className='size-1200 radius-circle bg-action-over-media content-action-over-media flex items-center justify-center'
                aria-hidden='true'>
                <PlayArrowIcon />
              </span>
            </button>
          )}
        </div>
        <div>
          <Card classes={{ root: studioCard }} variant='outlined'>
            <Flex flexDirection='column' alignItems='center' justifyContent='center'>
              <img className={studioCardIcon} src={studioLogoSvg[themeMode]} alt='Roblox Studio' />
              <Typography classes={{ root: studioCardHeading }} variant='h5' textAlign='center'>
                {translate('Heading.GetRobloxStudio')}
              </Typography>
              <Typography
                classes={{ root: studioCardDescription }}
                variant='body2'
                color='secondary'
                textAlign='center'>
                {translate('Description.GetRobloxStudio')}
              </Typography>
              <Button
                disabled={disabled}
                onClick={async () => {
                  setDisabled(true);
                  onConvert('clickDownload');

                  if (!isCompatible) {
                    onConvert('clickDocsDownload');
                    window.open(creatorHub.docs.getSettingUpStudioUrl(), '_blank');
                  } else {
                    const url = await getStudioDownloadUrlAsync();
                    trackerClient.sendEvent(downloadStudioDirectDownloadEventModel());
                    window.location.href = url;
                  }
                }}
                classes={{ root: studioCardButton }}
                variant='contained'
                color='primary'
                startIcon={<GetAppIcon />}>
                {translate('Label.Download')}
              </Button>
            </Flex>
          </Card>
        </div>
      </Flex>
    </Card>
  );
};

export default withTranslation(VideoOnboardingCard, [TranslationNamespace.Home]);
