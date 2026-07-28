import { useEffect } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';

/**
 * Page for accessing external purchase settings for developer products.
 *
 * Now deprecated in favor of shops: [Personalized Shops]({@link ../shop/index.tsx})
 */
const ExternalPurchaseSettingsPage: NextLayoutPage = () => {
  const router = useRouter();

  const { universeId } = useUniverseId();

  // Deprecated path in favor of shops: re-route to personalized shops on launch.
  // Feature will be deprecated entirely in the upcoming future.
  useEffect(() => {
    if (universeId) {
      void router.replace(dashboard.getPersonalizedShopsUrl(universeId));
    }
  }, [router, universeId]);

  // Just show empty page while waiting for redirect if necessary
  return <ProgressCircleLoader />;
};

ExternalPurchaseSettingsPage.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: undefined });
ExternalPurchaseSettingsPage.loggerConfig = { rosId: RosTeams.MonetizationProducts };

export default ExternalPurchaseSettingsPage;
