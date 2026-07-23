import React, { FC, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import { AnalyticsViewType } from './utils';
import AnalyticsPageContentV2 from './components/AnalyticsPageContentV2';
import AnalyticsDataBanner from './components/AnalyticsDataBanner';

const AdsAnalyticsPage: FC = () => {
  const router = useRouter();
  const [analyticsViewType, setAnalyticsViewType] = useState<AnalyticsViewType>(
    AnalyticsViewType.Overview,
  );

  useEffect(() => {
    if (router.isReady) {
      const { adType } = router.query;
      if (adType && Object.values(AnalyticsViewType).includes(adType as AnalyticsViewType)) {
        setAnalyticsViewType(adType as AnalyticsViewType);
      }
    }
  }, [router.isReady, router.query]);

  const handleAnalyticsViewTypeChange = (newViewType: AnalyticsViewType) => {
    setAnalyticsViewType(newViewType);

    const newQuery = { ...router.query, adType: newViewType };
    router.push(
      {
        pathname: router.pathname,
        query: newQuery,
      },
      undefined,
      { shallow: true },
    );
  };

  return (
    <React.Fragment>
      <AnalyticsDataBanner />
      <AnalyticsPageContentV2
        analyticsViewType={analyticsViewType}
        setAnalyticsViewType={handleAnalyticsViewTypeChange}
      />
    </React.Fragment>
  );
};

export default withTranslation(AdsAnalyticsPage, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ImmersiveAdsAnalytics,
]);
