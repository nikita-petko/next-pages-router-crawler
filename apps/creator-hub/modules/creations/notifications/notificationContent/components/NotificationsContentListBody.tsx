import type { FC } from 'react';
import React from 'react';
import { TableBody, TableCell, TableRow } from '@rbx/ui';
import type { ConfigureExperienceNotificationResponse } from '@modules/clients/notifications';
import NotificationContentRowActions from './NotificationContentRowActions';

type NotificationsContentListBodyProps = {
  displayUpdatesList: ConfigureExperienceNotificationResponse[];
  universeId: number;
};
const NotificationsContentListBody: FC<
  React.PropsWithChildren<NotificationsContentListBodyProps>
> = ({ displayUpdatesList, universeId }) => {
  return (
    <TableBody>
      {displayUpdatesList.map((content) => (
        <TableRow key={content.id}>
          <TableCell>{content.id}</TableCell>
          <TableCell>{content.name}</TableCell>
          <TableCell>{content.content}</TableCell>
          <TableCell>
            <NotificationContentRowActions universeId={universeId} content={content} />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
};

export default NotificationsContentListBody;
