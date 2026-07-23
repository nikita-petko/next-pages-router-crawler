import type { FunctionComponent } from 'react';
import React from 'react';
import type {
  CreatorNotification,
  NotificationChannelPreferences,
} from '@rbx/client-creator-settings/v1';
import { NotificationPreferenceStatus } from '@rbx/client-creator-settings/v1';
import { useTranslation } from '@rbx/intl';
import { Grid, Switch, Typography } from '@rbx/ui';
import useCategorySettingStyles from './CategorySetting.styles';

type CategorySettingProps = {
  notification: CreatorNotification;
  notificationIndex: number;
  onChange: (settingIndex: number, channelIndex: number) => void;
};

const CategorySetting: FunctionComponent<React.PropsWithChildren<CategorySettingProps>> = ({
  notification,
  notificationIndex,
  onChange,
}) => {
  const { classes: styles } = useCategorySettingStyles();
  const { translate } = useTranslation();

  return (
    <Grid className={styles.outerGrid} direction='column' container>
      <Typography className={styles.notificationDescription} variant='h6'>
        {translate(`Description.NotificationType${notification.notificationType}`)}
      </Typography>
      <Grid className={styles.channelContainer} container direction='column'>
        {notification.notificationChannelPreferences?.map(
          (channel: NotificationChannelPreferences, channelIndex: number) => {
            return (
              <Grid item className={styles.option} key={channel.notificationChannel}>
                <Switch
                  color='primary'
                  aria-label='switch'
                  checked={
                    channel.status === NotificationPreferenceStatus.All ||
                    channel.status === NotificationPreferenceStatus.Personalized
                  }
                  onClick={() => onChange(notificationIndex, channelIndex)}
                />
                <Typography>{translate(`Label.${channel.notificationChannel}`)}</Typography>
              </Grid>
            );
          },
        )}
      </Grid>
    </Grid>
  );
};

export default CategorySetting;
