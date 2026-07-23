import { useEffect } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/compat/router';
import { PageLoading } from '@modules/miscellaneous/common';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';

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

    // Safe assert - note router overrides query params for path in pages router
    const universeId = router.query.id as string;
    if (universeId) {
      router.replace(getPriceCheckLink(universeId));
    }
  }, [router]);

  // Just show empty page while waiting for redirect if necessary
  return <PageLoading />;
};

export default PriceValidationPage;
