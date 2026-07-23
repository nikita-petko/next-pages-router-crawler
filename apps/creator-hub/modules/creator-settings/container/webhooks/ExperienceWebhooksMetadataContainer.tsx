import type { FunctionComponent } from 'react';
import React from 'react';
import { SnackbarProvider } from '@rbx/ui';
import { UniverseWebhooksProvider, useUniverseWebhooks } from '@modules/react-query/webhooks';
import useSnackbarNotificationMessage from '../../components/useSnackbarNotificationMessage';
import WebhooksContainer from './WebhooksContainer';

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
        <WebhooksContainer
          basePath={basePath}
          useWebhooksHook={useUniverseWebhooks}
          useHardcodedTriggers
          experienceId={universeId}
        />
      </UniverseWebhooksProvider>
    </SnackbarProvider>
  );
};

export default ExperienceWebhooksMetadataContainer;
