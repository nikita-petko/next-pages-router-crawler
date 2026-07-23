import { ReactNode } from 'react';
import { SnackbarProvider } from '@rbx/ui';
import Authenticated from '@modules/authentication/Authenticated';
import type { NextLayoutPage } from 'next';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import CreatorSettingsAdvancedContainer from '@modules/advanced-settings/container/CreatorSettingsAdvancedContainer';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { PageNotFound } from '@modules/miscellaneous/error';
import { PageLoading } from '@modules/miscellaneous/common';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';

const getSettingsPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, { title: 'Heading.Advanced' });

const CreatorSettingsAdvancedPage: NextLayoutPage = () => {
  const { isFetched, params: ixpParams } = useIXPParameters(IXPLayers.CreatorDashboard);
  if (process.env.buildTarget === 'luobu') {
    return <PageNotFound />;
  }
  if (isFetched && (ixpParams.showAdvancedSettingsPage ?? false)) {
    return (
      <Authenticated>
        <SnackbarProvider>
          <ToolboxServiceApiProvider>
            <CreatorSettingsAdvancedContainer />
          </ToolboxServiceApiProvider>
        </SnackbarProvider>
      </Authenticated>
    );
  }

  if (!isFetched) {
    return <PageLoading />;
  }

  return <PageNotFound />;
};

CreatorSettingsAdvancedPage.getPageLayout = getSettingsPageLayout;

export default CreatorSettingsAdvancedPage;
