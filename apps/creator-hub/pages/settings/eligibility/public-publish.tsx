import type { ReactNode } from 'react';
import { useEffect } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { Translate } from '@rbx/intl';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import { PageLoading } from '@modules/miscellaneous/components';

const getPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.PublicReach' translationKey='Heading.PublicPublish' />
    ),
  });

const PublicPublishPage: NextLayoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    void router.replace('/settings/eligibility/publishing-permissions');
  }, [router]);

  return <PageLoading />;
};

PublicPublishPage.getPageLayout = getPageLayout;
PublicPublishPage.loggerConfig = { rosId: RosTeams.CreatorHubPlatform };

export default PublicPublishPage;
