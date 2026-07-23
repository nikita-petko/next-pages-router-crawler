import type { FC } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { TableCell, TableHead, TableRow } from '@rbx/ui';
import useNotificationContentListStyles from '../styles/notificationContentList';

const NotificationsContentListHeader: FC<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const {
    classes: { tableHeadTitle },
  } = useNotificationContentListStyles();
  return (
    <TableHead classes={{ root: tableHeadTitle }}>
      <TableRow>
        <TableCell>{translate('Common.ID')}</TableCell>
        <TableCell>{translate('Label.Name')}</TableCell>
        <TableCell>{translate('Common.String')}</TableCell>
        <TableCell>{translate('Common.Actions')}</TableCell>
      </TableRow>
    </TableHead>
  );
};

export default NotificationsContentListHeader;
