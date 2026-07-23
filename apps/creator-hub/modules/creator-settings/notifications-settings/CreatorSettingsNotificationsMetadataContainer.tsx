import type { FunctionComponent } from 'react';
import React from 'react';
import { SnackbarProvider } from '@rbx/ui';
import CreatorSettingsNotificationsHomeContainer from './home/CreatorSettingsNotificationsHomeContainer';

const CreatorSettingsNotificationsMetadataContainer: FunctionComponent<
  React.PropsWithChildren
> = () => {
  return (
    <SnackbarProvider>
      <CreatorSettingsNotificationsHomeContainer />
    </SnackbarProvider>
  );
};

export default CreatorSettingsNotificationsMetadataContainer;
