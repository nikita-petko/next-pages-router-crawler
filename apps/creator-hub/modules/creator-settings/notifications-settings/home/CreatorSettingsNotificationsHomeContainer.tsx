import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useContext } from 'react';
import type { CreatorNotificationCategory } from '@rbx/client-creator-settings/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Grid, Typography } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/components';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import NestedSettingsCategoryLink from '../../components/NestedSettingsCategoryLink';
import type { TCreatorNotificationsSettingsContext } from '../../hooks/CreatorNotificationsSettingsContext';
import { CreatorNotificationsSettingsContext } from '../../hooks/CreatorNotificationsSettingsContext';
import useCreatorSettingsNotificationsHomeContainerStyles from './CreatorSettingsNotificationsHomeContainer.styles';

const CreatorSettingsNotificationsHomeContainer: FunctionComponent<
  React.PropsWithChildren
> = () => {
  const { translate, ready: translateReady } = useTranslation();
  const { classes: styles } = useCreatorSettingsNotificationsHomeContainerStyles();
  const {
    notificationSettings,
    getNotificationSettings,
    notificationSettingsContextLoading,
    notificationSettingsFailedToLoad,
  } = useContext<TCreatorNotificationsSettingsContext>(CreatorNotificationsSettingsContext);

  const router = useRouter();

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

  const settingsTable = notificationSettings.map(
    (category: CreatorNotificationCategory, index: number) => (
      <NestedSettingsCategoryLink
        key={category.notificationCategoryName}
        categoryKey={category.notificationCategoryName || ''}
        categoryFriendlyKey={translate(`Label.Category${category.notificationCategoryName}`)}
        categoryDescription={translate(`Description.Category${category.notificationCategoryName}`)}
        onClick={() => router.push(`notifications/${category.notificationCategoryName}`)}
        divider={index !== Object.keys(notificationSettings).length - 1}
      />
    ),
  );

  return (
    <Grid className={styles.grid} container direction='column'>
      <Grid className={styles.titleRowGap} item container direction='column'>
        <Grid item>
          <Typography variant='body1'>{translate('Description.NotificationsSubtext')}</Typography>
        </Grid>
      </Grid>
      <Grid container direction='column'>
        {settingsTable}
      </Grid>
    </Grid>
  );
};

export default withTranslation(CreatorSettingsNotificationsHomeContainer, [
  TranslationNamespace.Notifications,
  TranslationNamespace.Settings,
  TranslationNamespace.SendrNotificationPreferences,
]);
