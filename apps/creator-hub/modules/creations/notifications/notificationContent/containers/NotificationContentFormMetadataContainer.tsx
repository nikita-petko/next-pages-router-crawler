import type { FunctionComponent } from 'react';
import React from 'react';
import GameProvider from '@modules/providers/game/GameProvider';
import type { NotificationContentFormContainerProps } from '../../types/notificationContentForm';
import NotificationContentFormContainer from './NotificationContentFormContainer';

const NotificationContentFormMetadataContainer: FunctionComponent<
  React.PropsWithChildren<NotificationContentFormContainerProps>
> = (props) => (
  <GameProvider>
    <NotificationContentFormContainer {...props} />
  </GameProvider>
);

export default NotificationContentFormMetadataContainer;
