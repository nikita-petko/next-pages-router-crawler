import React, { FC, useMemo, useCallback, ComponentPropsWithoutRef, useRef } from 'react';
import { Flex } from '@modules/miscellaneous/common/components';
import {
  Button,
  buttonClasses,
  CloseIcon,
  IconButton,
  Link,
  Collapse,
  makeStyles,
  RobuxIcon,
  Typography,
  useMediaQuery,
} from '@rbx/ui';
import { useLocalStorage } from '@rbx/react-utilities';
import { startOfToday } from '@rbx/core';
import { useAuthentication } from '@modules/authentication/providers';
import { useImpressionObserver } from '@modules/charts-generic';
import { TranslationKey } from '@modules/analytics-translations';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useUniverseResource } from '../../hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';

type IconProps = ComponentPropsWithoutRef<typeof RobuxIcon>;

const useStyles = makeStyles()((theme) => {
  const isDarkMode = theme.palette.mode === 'dark';
  return {
    container: {
      backgroundColor: isDarkMode
        ? theme.palette.components.avatar.fill
        : theme.palette.content.inverse,
      padding: '16px',
      ...theme.border.radius.large,
      width: '100%',
    },
    iconContainer: {
      [`&.${buttonClasses.disabled}`]: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
      },
      padding: '8px',
      ...theme.border.radius.medium,
      alignSelf: 'center',
      width: '40px',
      aspectRatio: '1',
    },
    content: {
      flex: '1 1 auto',
    },
    actionButton: {
      flex: '0 0 fit-content',
    },
    actionButtonCompactView: {
      width: '100%',
    },
    collapseBannerRoot: {
      width: '100%',
    },
  };
});

type GenericAnalyticsNUXBannerProps = {
  // This is logged as a parameter during impression and click events.
  newUserExperienceName: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  primaryButtonLabelKey: TranslationKey;
  closeButtonLabelKey: TranslationKey;
  linkOnPrimaryButtonClick: string;
  expirationTime: Date;
  icon: React.FC<IconProps>;
};

/**
 * TODO: https://roblox.atlassian.net/browse/DSA-3130
 * Unfortunately we can't directly use Alert component from our design system because
 * it doesn't take care compact view at the time of this writing.
 */
const GenericAnalyticsNUXBanner: FC<GenericAnalyticsNUXBannerProps> = ({
  newUserExperienceName,
  titleKey,
  descriptionKey,
  primaryButtonLabelKey,
  closeButtonLabelKey,
  linkOnPrimaryButtonClick,
  expirationTime,
  icon: Icon,
}) => {
  const {
    classes: {
      container,
      iconContainer,
      content,
      actionButton,
      actionButtonCompactView,
      collapseBannerRoot,
    },
    cx,
  } = useStyles();
  const { id: universeId } = useUniverseResource();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { translate } = useRAQIV2TranslationDependencies();
  const { user } = useAuthentication();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const cardRef = useRef<HTMLDivElement>(null);

  const [hasUserSeen, setHasUserSeen] = useLocalStorage(
    `${newUserExperienceName}NUXBanner-${user?.id}`,
    false,
  );

  const expired = useMemo(() => {
    return expirationTime ? startOfToday() > expirationTime : false;
  }, [expirationTime]);

  const shouldShow = useMemo(() => {
    return !hasUserSeen && !expired;
  }, [hasUserSeen, expired]);

  const loggingParameters = useMemo(() => {
    return {
      name: newUserExperienceName,
      universe_id: `${universeId}`,
    };
  }, [newUserExperienceName, universeId]);

  const handleCloseClick = useCallback(() => {
    setHasUserSeen(true);
    unifiedLogger.logClickEvent({
      eventName: `analytics/banner/newUserExperienceBannerDismiss`,
      parameters: loggingParameters,
    });
  }, [setHasUserSeen, unifiedLogger, loggingParameters]);

  const handlePrimaryButtonClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: `analytics/banner/newUserExperienceBannerPrimaryButtonClick`,
      parameters: loggingParameters,
    });
  }, [unifiedLogger, loggingParameters]);

  const sendImpressionEvent = useCallback(() => {
    unifiedLogger.logImpressionEvent({
      eventName: `analytics/banner/newUserExperienceBannerImpression`,
      parameters: loggingParameters,
    });
  }, [unifiedLogger, loggingParameters]);
  useImpressionObserver(cardRef, sendImpressionEvent);

  const { icon, titleContent, descriptionContent, primaryButton, closeButton } = useMemo(() => {
    return {
      icon: isCompactView ? null : (
        <IconButton
          aria-label='thumbnail-icon'
          variant='contained'
          disabled
          classes={{ root: iconContainer }}>
          <Icon fontSize='large' />
        </IconButton>
      ),
      titleContent: (
        <Typography variant='h6' display='block'>
          {translate(titleKey)}
        </Typography>
      ),
      descriptionContent: (
        <Typography variant='body1' color='secondary'>
          {translate(descriptionKey)}
        </Typography>
      ),
      primaryButton: (
        <div
          className={cx(actionButton, {
            [actionButtonCompactView]: isCompactView,
          })}>
          <Link
            href={linkOnPrimaryButtonClick}
            underline='none'
            paddingRight='8px'
            onClick={handlePrimaryButtonClick}>
            <Button variant='contained' size='small' color='secondary' fullWidth>
              {translate(primaryButtonLabelKey)}
            </Button>
          </Link>
        </div>
      ),
      closeButton: isCompactView ? (
        <div className={cx(actionButton, actionButtonCompactView)}>
          <Button
            variant='outlined'
            size='small'
            color='secondary'
            onClick={handleCloseClick}
            fullWidth>
            {translate(closeButtonLabelKey)}
          </Button>
        </div>
      ) : (
        <IconButton
          aria-label='close'
          color='inherit'
          onClick={handleCloseClick}
          size={isCompactView ? 'small' : 'medium'}>
          <CloseIcon color='inherit' fontSize='small' />
        </IconButton>
      ),
    };
  }, [
    isCompactView,
    iconContainer,
    Icon,
    translate,
    titleKey,
    descriptionKey,
    cx,
    actionButton,
    actionButtonCompactView,
    linkOnPrimaryButtonClick,
    handlePrimaryButtonClick,
    primaryButtonLabelKey,
    handleCloseClick,
    closeButtonLabelKey,
  ]);

  const bannerContent = (
    <Flex
      classes={{ root: container }}
      gap={16}
      flexDirection={isCompactView ? 'column' : 'row'}
      alignItems={isCompactView ? 'flex-start' : 'center'}
      ref={cardRef}>
      {icon}
      <div className={content}>
        {titleContent}
        {descriptionContent}
      </div>
      {primaryButton}
      {closeButton}
    </Flex>
  );

  return (
    <Collapse
      in={shouldShow}
      unmountOnExit
      mountOnEnter
      classes={{
        root: collapseBannerRoot,
      }}>
      {bannerContent}
    </Collapse>
  );
};

export default GenericAnalyticsNUXBanner;
