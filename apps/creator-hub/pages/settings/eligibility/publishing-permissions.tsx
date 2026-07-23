import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import PublishingPermissionsPageContent from '@modules/publishing-permissions/pages/PublishingPermissionsPageContent';

const getPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, {
    title: (
      <Translate
        namespace='CreatorDashboard.PublicReach'
        translationKey='Heading.PublishingPermissions'
      />
    ),
  });

const PublishingPermissionsPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <PublishingPermissionsPageContent />
    </Authenticated>
  );
};

PublishingPermissionsPage.getPageLayout = getPageLayout;
PublishingPermissionsPage.loggerConfig = { rosId: RosTeams.GameOperations };

export default PublishingPermissionsPage;
