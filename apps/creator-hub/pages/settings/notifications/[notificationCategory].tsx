import Authenticated from '@modules/authentication/Authenticated';
import type { NextGetPageLayout, NextLayoutPage } from 'next';
import CreatorSettingsNotificationsCategoryMetadataContainer from '@modules/creator-settings/notifications-settings/category/CreatorSettingsNotificationsCategoryMetadataContainer';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import { PageNotFound } from '@modules/miscellaneous/error';

const getSettingsPageLayout: NextGetPageLayout = (page, { query }) => {
  const categoryKey = query.notificationCategory;

  return getCreatorSettingsAppNavigationLayout(page, { title: `Heading.Category${categoryKey}` });
};

const NotificationsSettingsCategoryPage: NextLayoutPage = () => {
  if (process.env.buildTarget === 'luobu') {
    return <PageNotFound />;
  }

  return (
    <Authenticated>
      <CreatorSettingsNotificationsCategoryMetadataContainer />
    </Authenticated>
  );
};

NotificationsSettingsCategoryPage.getPageLayout = getSettingsPageLayout;

export default NotificationsSettingsCategoryPage;
