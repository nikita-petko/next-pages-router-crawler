import { useEffect } from 'react';
import type { NextLayoutPage } from 'next';
import { SnackbarProvider } from '@rbx/ui';
import { analyticsVideoServiceNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import VideoServicePageContent from '@modules/cloud-services/insights/pages/VideoServicePageContent';
import { useHasUserSeenAnalyticsPage } from '@modules/creations/common/components/AnalyticsPageNewChip';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';

const VideoServiceAnalyticsPage: NextLayoutPage = () => {
  const { setHasUserSeen } = useHasUserSeenAnalyticsPage(analyticsVideoServiceNavigationItem.path);

  useEffect(() => {
    setHasUserSeen(true);
  }, [setHasUserSeen]);

  return (
    <SnackbarProvider>
      <VideoServicePageContent />
    </SnackbarProvider>
  );
};

VideoServiceAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsVideoServiceNavigationItem });
VideoServiceAnalyticsPage.loggerConfig = { rosId: RosTeams.Analytics };

export default VideoServiceAnalyticsPage;
