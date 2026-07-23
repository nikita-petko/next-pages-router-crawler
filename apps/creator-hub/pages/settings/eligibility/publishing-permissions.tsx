import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import { useSettings } from '@modules/settings';
import { PageNotFound } from '@modules/miscellaneous/error';
import { PageLoading } from '@modules/miscellaneous/common';
import PublishingPermissionsPageContent from '@modules/publishing-permissions/pages/PublishingPermissionsPageContent';

const getPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, { title: 'Heading.PublishingPermissions' });

const PublishingPermissionsPage: NextLayoutPage = () => {
  const { settings, isFetched } = useSettings();

  if (!isFetched) {
    return <PageLoading />;
  }

  if (!settings.enableCoreContentStatusLabelLink) {
    return <PageNotFound />;
  }

  return (
    <Authenticated>
      <PublishingPermissionsPageContent />
    </Authenticated>
  );
};

PublishingPermissionsPage.getPageLayout = getPageLayout;

export default PublishingPermissionsPage;
