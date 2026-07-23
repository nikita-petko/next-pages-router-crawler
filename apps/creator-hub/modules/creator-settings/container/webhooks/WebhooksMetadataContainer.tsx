import type { FunctionComponent } from 'react';
import React from 'react';
import { SnackbarProvider } from '@rbx/ui';
import { WebhooksProvider } from '@modules/react-query/webhooks';
import useSnackbarNotificationMessage from '../../components/useSnackbarNotificationMessage';
import WebhooksContainer from './WebhooksContainer';

const WebhooksMetadataContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const showSnackbarMessage = useSnackbarNotificationMessage();
  return (
    <SnackbarProvider>
      <WebhooksProvider showSnackbarMessage={showSnackbarMessage}>
        <WebhooksContainer />
      </WebhooksProvider>
    </SnackbarProvider>
  );
};

export default WebhooksMetadataContainer;
