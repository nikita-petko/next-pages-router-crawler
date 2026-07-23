import type { NextGetPageLayout, NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import CreatorSettingsNotificationsCategoryMetadataContainer from '@modules/creator-settings/notifications-settings/category/CreatorSettingsNotificationsCategoryMetadataContainer';
import { PageNotFound } from '@modules/miscellaneous/error';

const VALID_CATEGORY_KEYS = [
  'CloudServices',
  'CreatorAnalytics',
  'CreatorComments',
  'CreatorExperiencePermissions',
  'CreatorGroups',
  'CreatorMonetizationTools',
  'CreatorOutreach',
  'CreatorStore',
  'ExperienceManagement',
  'Oauth2',
  'PlatformFeedback',
] as const;

const getSettingsPageLayout: NextGetPageLayout = (page, { query }) => {
  const validKey = VALID_CATEGORY_KEYS.find((k) => k === query.notificationCategory);

  return getCreatorSettingsAppNavigationLayout(page, {
    title: validKey ? (
      <Translate
        namespace='CreatorDashboard.PageTitles'
        translationKey={`Heading.Category${validKey}`}
      />
    ) : (
      ''
    ),
  });
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
NotificationsSettingsCategoryPage.loggerConfig = { rosId: RosTeams.CreatorHubPlatform };

export default NotificationsSettingsCategoryPage;
