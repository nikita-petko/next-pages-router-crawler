import { useEffect } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/compat/router';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';

const getPriceCheckLink = dashboard.getMonetizationDynamicPriceCheckUrl;

/**
 * Deprecated route, [see redirected route here]({@link ../price-check.tsx})
 */
const PriceValidationPage: NextLayoutPage = () => {
  const router = useRouter();
  useEffect(() => {
    if (!router?.isReady) {
      return;
    }

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Safe assert - note router overrides query params for path in pages router
    const universeId = router.query.id as string;
    if (universeId) {
      void router.replace(getPriceCheckLink(universeId));
    }
  }, [router]);

  // Just show empty page while waiting for redirect if necessary
  return <ProgressCircleLoader />;
};

PriceValidationPage.loggerConfig = { rosId: RosTeams.MonetizationProducts };
export default PriceValidationPage;
