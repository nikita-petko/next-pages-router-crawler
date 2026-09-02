import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import EligibilityContainer from '@modules/creator-settings/container/eligibility/EligibilityContainer';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';

const getSettingsPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Eligibility' />
    ),
  });

const EligibilityPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ToolboxServiceApiProvider>
        <EligibilityContainer />
      </ToolboxServiceApiProvider>
    </Authenticated>
  );
};

EligibilityPage.getPageLayout = getSettingsPageLayout;
EligibilityPage.loggerConfig = { rosId: RosTeams.CreatorHubPlatform };

export default EligibilityPage;
