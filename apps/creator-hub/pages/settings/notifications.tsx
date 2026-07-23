import { ReactNode } from 'react';
import Authenticated from '@modules/authentication/Authenticated';
import type { NextLayoutPage } from 'next';
import CreatorSettingsNotificationsMetadataContainer from '@modules/creator-settings/notifications-settings/CreatorSettingsNotificationsMetadataContainer';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import { PageNotFound } from '@modules/miscellaneous/error';

const getSettingsPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, { title: 'Heading.Notifications' });

const NotificationsSettingsPage: NextLayoutPage = () => {
  if (process.env.buildTarget === 'luobu') {
    return <PageNotFound />;
  }

  return (
    <Authenticated>
      <CreatorSettingsNotificationsMetadataContainer />
    </Authenticated>
  );
};

NotificationsSettingsPage.getPageLayout = getSettingsPageLayout;

export default NotificationsSettingsPage;
