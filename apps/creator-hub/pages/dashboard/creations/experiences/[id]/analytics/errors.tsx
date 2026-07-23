import { useEffect } from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsErrorReportNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { useHasUserSeenAnalyticsPage } from '@modules/creations/common/components/AnalyticsPageNewChip';
import { OnboardingTipsProvider } from '@modules/experience-analytics-shared/context/OnboardingTipsProvider';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import ErrorReportPageContentContainer from '@modules/experience-monitoring/pages/ErrorReportPageV2/ErrorReportPageContentContainer';

const ErrorReportPage: NextLayoutPage = () => {
  const { setHasUserSeen } = useHasUserSeenAnalyticsPage(analyticsErrorReportNavigationItem.path);

  useEffect(() => {
    setHasUserSeen(true);
  }, [setHasUserSeen]);

  return (
    <OnboardingTipsProvider>
      <ErrorReportPageContentContainer />
    </OnboardingTipsProvider>
  );
};

ErrorReportPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsErrorReportNavigationItem });
ErrorReportPage.loggerConfig = { rosId: RosTeams.Analytics };

export default ErrorReportPage;
