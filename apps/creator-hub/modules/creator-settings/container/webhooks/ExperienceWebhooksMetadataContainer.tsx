import { SnackbarProvider } from '@rbx/ui';
import React, { FunctionComponent } from 'react';
import { UniverseWebhooksProvider, useUniverseWebhooks } from '@modules/react-query/webhooks';
import WebhooksContainer from './WebhooksContainer';
import useSnackbarNotificationMessage from '../../components/useSnackbarNotificationMessage';

type ExperienceWebhooksMetadataContainerProps = {
  universeId: number;
  basePath: string;
};

const ExperienceWebhooksMetadataContainer: FunctionComponent<
  React.PropsWithChildren<ExperienceWebhooksMetadataContainerProps>
> = ({ universeId, basePath }) => {
  const showSnackbarMessage = useSnackbarNotificationMessage();
  return (
    <SnackbarProvider>
      <UniverseWebhooksProvider universeId={universeId} showSnackbarMessage={showSnackbarMessage}>
        <WebhooksContainer basePath={basePath} useWebhooksHook={useUniverseWebhooks} />
      </UniverseWebhooksProvider>
    </SnackbarProvider>
  );
};

export default ExperienceWebhooksMetadataContainer;
