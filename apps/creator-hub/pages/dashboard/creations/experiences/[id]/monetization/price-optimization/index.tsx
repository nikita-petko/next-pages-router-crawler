import { useEffect } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { Translate } from '@rbx/intl';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';

/**
 * Deprecated route, now redirects to managed pricing page. [See redirected route here]({@link ../managed-pricing/index.tsx})
 */
const PriceOptimizationPage: NextLayoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    if (!router?.isReady) {
      return;
    }

    const universeId = Number(router.query.id);
    void router.replace(dashboard.getManagedPricingUrl(universeId));
  }, [router]);

  // Just show empty page while waiting for redirect if necessary
  return <ProgressCircleLoader />;
};

PriceOptimizationPage.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: (
      <Translate
        namespace='CreatorDashboard.Navigation'
        translationKey='Heading.PriceOptimization'
      />
    ),
  });
PriceOptimizationPage.loggerConfig = { rosId: RosTeams.MonetizationProducts };

export default PriceOptimizationPage;
