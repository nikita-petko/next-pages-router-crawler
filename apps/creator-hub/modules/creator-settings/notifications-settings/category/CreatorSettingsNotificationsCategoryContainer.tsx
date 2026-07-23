import type { ParsedUrlQuery } from 'node:querystring';
import Router, { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useEffect, useState, useContext, useCallback } from 'react';
import type {
  CreatorNotification,
  CreatorNotificationCategory,
} from '@rbx/client-creator-settings/v1';
import { NotificationPreferenceStatus } from '@rbx/client-creator-settings/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, CircularProgress, Divider, Grid, Typography, StickyFooter } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { creatorSettingsClient } from '@modules/clients/creatorSettings';
import {
  loadNotificationCategoryEventModel,
  notificationsSettingsCategoryCancelEventModel,
} from '@modules/eventStream/constants/eventConstants';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { PageNotFound } from '@modules/miscellaneous/error';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useSnackbarNotificationMessage from '../../components/useSnackbarNotificationMessage';
import type { TCreatorNotificationsSettingsContext } from '../../hooks/CreatorNotificationsSettingsContext';
import { CreatorNotificationsSettingsContext } from '../../hooks/CreatorNotificationsSettingsContext';
import computeSettingsDelta from '../utils/computeSettingsDelta';
import updateSettings from '../utils/updateSettings';
import CategorySetting from './CategorySetting';
import useCreatorSettingsNotificationsCategoryContainerStyles from './CreatorSettingsNotificationsCategoryContainer.styles';

interface NotificationCategoryQueryParams extends ParsedUrlQuery {
  notificationCategory?: string;
}

const CreatorSettingsNotificationsContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate, ready: translateReady } = useTranslation();
  const { trackerClient } = useEventTrackerProvider();
  const { user } = useAuthentication();
  const [editedNotificationSettings, setEditedNotificationSettings] = useState<
    CreatorNotificationCategory[]
  >([]);
  const [isEdited, setIsEdited] = useState<boolean>(false);
  const { classes: styles } = useCreatorSettingsNotificationsCategoryContainerStyles();
  const showSnackbarMessage = useSnackbarNotificationMessage();
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();
  const categoryKey = (router.query as NotificationCategoryQueryParams).notificationCategory || '';
  const [categoryIndex, setCategoryIndex] = useState<number>(-1);
  const {
    notificationSettings,
    getNotificationSettings,
    notificationSettingsContextLoading,
    notificationSettingsFailedToLoad,
    setNotificationSettings,
  } = useContext<TCreatorNotificationsSettingsContext>(CreatorNotificationsSettingsContext);

  useEffect(() => {
    trackerClient.sendEvent(loadNotificationCategoryEventModel(categoryKey));
  }, [categoryKey, trackerClient]);

  useEffect(() => {
    if (!notificationSettingsContextLoading && !notificationSettingsFailedToLoad) {
      setEditedNotificationSettings(structuredClone(notificationSettings));
      notificationSettings.find((category: CreatorNotificationCategory, index: number) => {
        if (category.notificationCategoryName === categoryKey) {
          setCategoryIndex(index);
          return true;
        }
        return false;
      });
    }
  }, [
    notificationSettingsFailedToLoad,
    notificationSettingsContextLoading,
    categoryKey,
    notificationSettings,
  ]);

  const updateEditedSettings = (settingIndex: number, channelIndex: number) => {
    const newSettings = updateSettings(
      categoryIndex,
      settingIndex,
      channelIndex,
      editedNotificationSettings,
    );
    setEditedNotificationSettings(newSettings);
    const edited = computeSettingsDelta(notificationSettings, newSettings);
    setIsEdited(edited);
  };

  const resetChanges = useCallback(() => {
    trackerClient.sendEvent(notificationsSettingsCategoryCancelEventModel(categoryKey));
    Router.push('../notifications');
  }, [categoryKey, trackerClient]);

  const submitChanges = useCallback(async () => {
    if (user?.id == null) {
      return;
    }

    try {
      setIsUpdating(true);
      const updatedSettingsArray = editedNotificationSettings?.flatMap(
        (category: CreatorNotificationCategory, index) => {
          return editedNotificationSettings[index].notifications?.flatMap((notification) => {
            const newNotification = structuredClone(notification);
            // NOTE (@mbae, 11/17/23): Invalid means we ignore notification type level toggling and
            // use finer-grained channel-specific info to update settings
            // We do this for all settings because the PATCH API requires the entire
            // settings object (it's acts like a PUT)
            newNotification.status = NotificationPreferenceStatus.Invalid;

            return newNotification;
          });
        },
      ) as CreatorNotification[];

      await creatorSettingsClient.updateCreatorSettings(user.id.toString(), updatedSettingsArray);
      setNotificationSettings(structuredClone(editedNotificationSettings));
      setIsEdited(false);
      showSnackbarMessage('success', translate('Description.SuccessfullySavedSettings'));
    } catch {
      showSnackbarMessage('error', translate('Error.SavingCreatorSettingsV1'));
    } finally {
      setIsUpdating(false);
    }
  }, [
    user?.id,
    editedNotificationSettings,
    setNotificationSettings,
    showSnackbarMessage,
    translate,
  ]);

  if (notificationSettingsFailedToLoad) {
    return <LoadError onReload={getNotificationSettings} />;
  }

  if (notificationSettingsContextLoading || !translateReady) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  if (categoryIndex === -1) {
    return <PageNotFound />;
  }

  const settingsList = editedNotificationSettings[categoryIndex].notifications?.map(
    (notification: CreatorNotification, index: number) => {
      return (
        <CategorySetting
          notification={notification}
          notificationIndex={index}
          onChange={updateEditedSettings}
          key={notification.notificationType}
        />
      );
    },
  );

  return (
    <Grid className={styles.grid} container direction='column'>
      <Grid className={styles.titleRowGap} item container direction='column'>
        <Grid item>
          <Typography variant='body1'>
            {translate(`Description.Category${categoryKey}`) ||
              translate('Description.NotificationsSubtext')}
          </Typography>
        </Grid>
      </Grid>
      <Grid className={styles.accordionTitleGap} container direction='column'>
        <Grid container className={styles.settingsGap}>
          {settingsList}
        </Grid>
      </Grid>
      <Grid container direction='column'>
        <Grid item>
          <Divider className={styles.divider} />
        </Grid>
        <StickyFooter
          secondary={{
            variant: 'outlined',
            color: 'secondary',
            onClick: resetChanges,
            label: translate(`Action.Cancel`),
          }}
          primary={{
            variant: 'contained',
            disabled: !isEdited,
            onClick: submitChanges,
            loading: isUpdating,
            label: translate('Action.SaveChanges'),
          }}
          classes={{ root: styles.stickyFooter }}
        />
        <Grid className={styles.buttonGap} item container>
          <Grid item>
            <Button variant='outlined' color='primary' onClick={resetChanges}>
              {translate('Action.Cancel')}
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant='contained'
              disabled={!isEdited}
              onClick={submitChanges}
              loading={isUpdating}>
              {translate('Action.SaveChanges')}
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(CreatorSettingsNotificationsContainer, [
  TranslationNamespace.Notifications,
  TranslationNamespace.Settings,
  TranslationNamespace.SendrNotificationPreferences,
]);
