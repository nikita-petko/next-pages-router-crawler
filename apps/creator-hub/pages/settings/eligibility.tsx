import { ReactNode } from 'react';
import Authenticated from '@modules/authentication/Authenticated';
import type { NextLayoutPage } from 'next';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';
import EligibilityContainer from '@modules/creator-settings/container/eligibility/EligibilityContainer';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';

const getSettingsPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, { title: 'Heading.Eligibility' });

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

export default EligibilityPage;
