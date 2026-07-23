import React, { FunctionComponent } from 'react';
import GameProvider from '@modules/providers/game/GameProvider';
import NotificationContentFormContainer from './NotificationContentFormContainer';
import { NotificationContentFormContainerProps } from '../../types/notificationContentForm';

const NotificationContentFormMetadataContainer: FunctionComponent<
  React.PropsWithChildren<NotificationContentFormContainerProps>
> = (props) => (
  <GameProvider>
    <NotificationContentFormContainer {...props} />
  </GameProvider>
);

export default NotificationContentFormMetadataContainer;
