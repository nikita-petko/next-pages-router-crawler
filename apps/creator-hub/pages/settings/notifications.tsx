import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import CreatorSettingsNotificationsMetadataContainer from '@modules/creator-settings/notifications-settings/CreatorSettingsNotificationsMetadataContainer';

const getSettingsPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Notifications' />
    ),
  });

const NotificationsSettingsPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <CreatorSettingsNotificationsMetadataContainer />
    </Authenticated>
  );
};

NotificationsSettingsPage.getPageLayout = getSettingsPageLayout;
NotificationsSettingsPage.loggerConfig = { rosId: RosTeams.CreatorHubPlatform };

export default NotificationsSettingsPage;
