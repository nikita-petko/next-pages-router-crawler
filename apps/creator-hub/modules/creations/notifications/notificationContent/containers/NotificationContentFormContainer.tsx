import { useAuthentication } from '@modules/authentication/providers';
import { useSettings } from '@modules/settings';
import { notificationsClient } from '@modules/clients/notifications';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { EmptyGrid } from '@modules/miscellaneous/common/components/EmptyGrid';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import { useRouter } from 'next/router';
import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import NotificationsTitle from '../../components/NotificationsTitle';
import { NotificationContentFormTypes } from '../../constants/notificationContentForm';
import {
  getNotificationString,
  getNotificationStringFailed,
  getNotificationStringSuccess,
} from '../../constants/notificationEventConstants';
import useContentId from '../../hooks/useContentId';
import useUniverseId from '../../hooks/useUniverseId';
import {
  NotificationContentFormContainerProps,
  NotificationContentFormType,
} from '../../types/notificationContentForm';
import NotificationContentForm from '../components/NotificationContentForm';

const NotificationContentFormContainer: FunctionComponent<
  React.PropsWithChildren<NotificationContentFormContainerProps>
> = ({ type }) => {
  const { trackerClient } = useEventTrackerProvider();
  const { gameDetails, isLoadingGame, canConfigure, refreshGameDetails } = useCurrentGame();
  const { translate } = useTranslation();
  const { settings } = useSettings();
  const contentId = useContentId();
  const { user } = useAuthentication();
  const [isLoadingNotificationContent, setIsLoadingNotificationContent] = useState(true);
  const [isGetNotificationContentFailed, setIsGetNotificationContentFailed] = useState(false);
  const translatedContentDefaultValue = settings.enableUENSocialMentions
    ? translate('Placeholder.NotificationStringContentExperienceNotificationSocialMention', {
        userIdHighScore: '{userId-highScorer}',
      })
    : translate('Placeholder.NotificationStringContentExperienceNotification');
  const englishContentDefaultValue = settings.enableUENSocialMentions
    ? '{userId-highScorer} beat your high score by {points} points!'
    : "You're {questsLeft} quests away from completing the daily challenge!";
  const initialFormValue = useMemo(
    () => ({
      name: '',
      content: translatedContentDefaultValue || englishContentDefaultValue,
    }),
    [translatedContentDefaultValue, englishContentDefaultValue],
  );
  const [defaultFormValue, setDefaultFormValue] = useState(initialFormValue);
  const titleText =
    type === NotificationContentFormTypes.update && contentId
      ? translate('Title.EditNotification')
      : translate('Title.CreateNotification');
  const router = useRouter();

  const universeId = useUniverseId();

  const getNotificationContent = useCallback(
    async (content: string) => {
      trackerClient.sendEvent(getNotificationString(user?.id, universeId, contentId));
      try {
        const contentData = await notificationsClient.getNotificationContent(content);
        const contentFormData: NotificationContentFormType = {
          name: contentData?.name ?? '',
          content: contentData?.content ?? '',
        };
        trackerClient.sendEvent(getNotificationStringSuccess(user?.id, universeId, contentId));
        setIsGetNotificationContentFailed(false);
        return contentFormData;
      } catch {
        trackerClient.sendEvent(getNotificationStringFailed(user?.id, universeId, contentId));
        setIsGetNotificationContentFailed(true);
        return initialFormValue;
      }
    },
    [contentId, universeId, initialFormValue, trackerClient, user?.id],
  );

  const initializeNotificationContent = useCallback(async () => {
    if (universeId && contentId) {
      setIsLoadingNotificationContent(true);
      const contentValue = await getNotificationContent(contentId);
      setDefaultFormValue(contentValue);
    } else {
      setDefaultFormValue(initialFormValue);
    }
    setIsLoadingNotificationContent(false);
  }, [universeId, contentId, initialFormValue, getNotificationContent]);

  const handlePageReload = useCallback(() => {
    if (universeId) {
      if (!gameDetails) {
        refreshGameDetails();
      }
      if (isGetNotificationContentFailed) {
        initializeNotificationContent();
      }
    }
  }, [
    initializeNotificationContent,
    refreshGameDetails,
    isGetNotificationContentFailed,
    universeId,
    gameDetails,
  ]);

  if (!universeId) {
    router.push('/dashboard/creations');
  }

  useEffect(() => {
    initializeNotificationContent();
  }, [initializeNotificationContent, universeId, contentId, initialFormValue]);

  if (isLoadingGame || isLoadingNotificationContent) {
    return (
      <EmptyGrid>
        <CircularProgress data-testid='loading' />
      </EmptyGrid>
    );
  }

  if (!canConfigure) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (!gameDetails || isGetNotificationContentFailed) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={handlePageReload}
      />
    );
  }

  return (
    <Grid container>
      <NotificationsTitle titleText={titleText} />
      <NotificationContentForm
        type={type}
        universeId={universeId as number}
        contentId={contentId}
        defaultFormValue={defaultFormValue}
      />
    </Grid>
  );
};

export default withTranslation(NotificationContentFormContainer, [
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Error,
  TranslationNamespace.Notifications,
]);
