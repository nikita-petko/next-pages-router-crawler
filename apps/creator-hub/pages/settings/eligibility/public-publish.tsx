import { ReactNode, useEffect } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import Authenticated from '@modules/authentication/Authenticated';
import PublicPublishPageContent from '@modules/public-publish/pages/PublicPublish/PublicPublishPageContent';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import { useSettings } from '@modules/settings';
import { PageLoading } from '@modules/miscellaneous/common';

const getPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, { title: 'Heading.PublicPublish' });

const PublicPublishPage: NextLayoutPage = () => {
  const router = useRouter();
  const { settings, isFetched } = useSettings();

  useEffect(() => {
    if (isFetched && settings.enableCoreContentStatusLabelLink) {
      router.replace('/settings/eligibility/publishing-permissions');
    }
  }, [isFetched, settings.enableCoreContentStatusLabelLink, router]);

  if (!isFetched) {
    return <PageLoading />;
  }

  if (settings.enableCoreContentStatusLabelLink) {
    return <PageLoading />;
  }

  return (
    <Authenticated>
      <PublicPublishPageContent />
    </Authenticated>
  );
};

PublicPublishPage.getPageLayout = getPageLayout;

export default PublicPublishPage;
