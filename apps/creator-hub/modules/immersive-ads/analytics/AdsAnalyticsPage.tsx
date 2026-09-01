import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { withTranslation } from '@rbx/intl';
import { OnboardingTipsProvider } from '@modules/experience-analytics-shared/context/OnboardingTipsProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AnalyticsDataBanner from './components/AnalyticsDataBanner';
import AnalyticsPageContentV2 from './components/AnalyticsPageContentV2';
import { AnalyticsViewType } from './utils';

const isAnalyticsViewType = (value: unknown): value is AnalyticsViewType =>
  typeof value === 'string' && (Object.values(AnalyticsViewType) as string[]).includes(value);

const AdsAnalyticsPage = () => {
  const router = useRouter();
  const [analyticsViewType, setAnalyticsViewType] = useState<AnalyticsViewType>(
    AnalyticsViewType.Overview,
  );

  useEffect(() => {
    if (router.isReady) {
      const { adType } = router.query;
      if (isAnalyticsViewType(adType)) {
        setAnalyticsViewType(adType);
      }
    }
  }, [router.isReady, router.query]);

  const handleAnalyticsViewTypeChange = (newViewType: AnalyticsViewType) => {
    setAnalyticsViewType(newViewType);

    const newQuery = { ...router.query, adType: newViewType };
    void router.push(
      {
        pathname: router.pathname,
        query: newQuery,
      },
      undefined,
      { shallow: true },
    );
  };

  return (
    <OnboardingTipsProvider>
      <AnalyticsDataBanner />
      <AnalyticsPageContentV2
        analyticsViewType={analyticsViewType}
        setAnalyticsViewType={handleAnalyticsViewTypeChange}
      />
    </OnboardingTipsProvider>
  );
};

export default withTranslation(AdsAnalyticsPage, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ImmersiveAdsAnalytics,
]);
