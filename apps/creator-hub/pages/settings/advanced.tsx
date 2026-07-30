import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import { SnackbarProvider } from '@rbx/ui';
import CreatorSettingsAdvancedContainer from '@modules/advanced-settings/container/CreatorSettingsAdvancedContainer';
import Authenticated from '@modules/authentication/Authenticated';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import { PageLoading } from '@modules/miscellaneous/components';
import { PageNotFound } from '@modules/miscellaneous/error';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';

const getSettingsPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Advanced' />,
  });

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
CreatorSettingsAdvancedPage.loggerConfig = { rosId: RosTeams.CreatorSettings };

export default CreatorSettingsAdvancedPage;
