import { ReactNode } from 'react';
import { DialogProvider, SnackbarProvider } from '@rbx/ui';
import Authenticated from '@modules/authentication/Authenticated';
import type { NextLayoutPage } from 'next';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import SettingsContainerV2 from '@modules/data-collection/components/SettingsContainerV2';
import { PageNotFound } from '@modules/miscellaneous/error';

const getSettingsPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, { title: 'Heading.DataSharing' });

const DataCollectionSettingsPage: NextLayoutPage = () => {
  if (process.env.buildTarget === 'luobu') {
    return <PageNotFound />;
  }

  return (
    <DialogProvider>
      <SnackbarProvider
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}>
        <Authenticated>
          <SettingsContainerV2 />
        </Authenticated>
      </SnackbarProvider>
    </DialogProvider>
  );
};

DataCollectionSettingsPage.getPageLayout = getSettingsPageLayout;

export default DataCollectionSettingsPage;
