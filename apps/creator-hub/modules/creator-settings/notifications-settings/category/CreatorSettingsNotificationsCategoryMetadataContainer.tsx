import type { FunctionComponent } from 'react';
import React from 'react';
import { SnackbarProvider } from '@rbx/ui';
import CreatorSettingsNotificationsCategoryContainer from './CreatorSettingsNotificationsCategoryContainer';

const CreatorSettingsNotificationsCategoryMetadataContainer: FunctionComponent<
  React.PropsWithChildren
> = () => {
  return (
    <SnackbarProvider>
      <CreatorSettingsNotificationsCategoryContainer />
    </SnackbarProvider>
  );
};

export default CreatorSettingsNotificationsCategoryMetadataContainer;
