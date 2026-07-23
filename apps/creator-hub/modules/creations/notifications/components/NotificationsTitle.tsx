import { Grid, Typography, useMediaQuery } from '@rbx/ui';
import React, { FC } from 'react';
import { useTranslation } from '@rbx/intl';
import useNotificationContentFormStyles from '../notificationContent/styles/notificationContentForm';

export interface NotificationsTitleProps {
  titleText?: string;
}

const NotificationsTitle: FC<React.PropsWithChildren<NotificationsTitleProps>> = ({
  titleText,
}) => {
  const { translate } = useTranslation();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const {
    classes: { containerPadding },
  } = useNotificationContentFormStyles();

  return (
    <Grid item XSmall={12} classes={{ root: containerPadding }}>
      <Typography variant={isCompactView ? 'h3' : 'h1'} data-testid='notifications-title'>
        {titleText ?? translate('Title.Notifications')}
      </Typography>
    </Grid>
  );
};

export default NotificationsTitle;
