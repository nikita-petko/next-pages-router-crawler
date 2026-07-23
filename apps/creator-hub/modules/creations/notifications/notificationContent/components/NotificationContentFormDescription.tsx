import { useTranslation } from '@rbx/intl';
import { Grid, Link, Typography } from '@rbx/ui';
import React, { FC } from 'react';
import { notificationContentPlayerInvitePromptDocUrl } from '../../constants/notificationContent';
import useNotificationContentFormStyles from '../styles/notificationContentForm';

const NotificationContentFormDescription: FC<React.PropsWithChildren<unknown>> = () => {
  const { translate, translateHTML } = useTranslation();
  const {
    classes: { createNotificationInfoText },
  } = useNotificationContentFormStyles();

  return (
    <Grid container item XSmall={12} className={createNotificationInfoText} direction='column'>
      <Typography variant='body1'>
        {translateHTML('Description.NotificationsIncreaseEngagement', [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content(chunks) {
              return (
                <Link href={notificationContentPlayerInvitePromptDocUrl} target='_blank'>
                  {chunks}
                </Link>
              );
            },
          },
        ])}
      </Typography>
      <Typography variant='body1'>
        {translate('Description.createNotificationRestrictions3')}
      </Typography>
    </Grid>
  );
};

export default NotificationContentFormDescription;
