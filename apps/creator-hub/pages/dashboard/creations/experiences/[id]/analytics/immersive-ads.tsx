import type { NextLayoutPage } from 'next';
import { analyticsImmersiveAdsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { OnboardingTipsProvider } from '@modules/experience-analytics-shared/context/OnboardingTipsProvider';
import UrlRedirectProvider from '@modules/experience-analytics-shared/context/UrlRedirectProvider';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import ImmersiveAdsPageContentV2 from '@modules/immersive-ads/pages/ImmersiveAdsPageContentV2';

const ImmersiveAdsAnalyticsPage: NextLayoutPage = () => {
  return (
    <UrlRedirectProvider>
      <OnboardingTipsProvider>
        <ImmersiveAdsPageContentV2 />
      </OnboardingTipsProvider>
    </UrlRedirectProvider>
  );
};

ImmersiveAdsAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsImmersiveAdsNavigationItem });
ImmersiveAdsAnalyticsPage.loggerConfig = { rosId: RosTeams.Analytics };

export default ImmersiveAdsAnalyticsPage;
