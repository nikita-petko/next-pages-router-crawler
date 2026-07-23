import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import DevExO18PageContentContainer from '@modules/experience-monetization/pages/DevExO18/DevExO18PageContentContainer';

const getPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, {
    title: (
      <Translate
        namespace='CreatorDashboard.DevEx'
        translationKey='Heading.DevExO18UsSettingsNav'
      />
    ),
  });

const DevExO18SettingsPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <DevExO18PageContentContainer />
    </Authenticated>
  );
};

DevExO18SettingsPage.getPageLayout = getPageLayout;
DevExO18SettingsPage.loggerConfig = { rosId: RosTeams.CreatorBusiness };

export default DevExO18SettingsPage;
