import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { PageLoading } from '@modules/miscellaneous/components';
import useIpFeatures from '../hooks/useIpFeatures';

/**
 * Redirects to the first feature in the IP menu.
 *
 * Since the IP menu can have different content for different
 * users. We always want to link to the first item in the IP
 * menu.
 *
 * To avoid having to move this logic to the top nav, we'll
 * add this intermediate redirect page (/dashboard/ip) that
 * will redirect the user to the first item in the IP menu.
 *
 * This keeps the top nav logic simpler, and our IP menu logic
 * more self-contained. However, the cost of this is that the
 * user will have a small additional delay from clicking on the
 * top-level IP menu item to seeing the content.
 */
const IpLandingRedirect: React.FC = () => {
  const router = useRouter();
  const { flatFeatures: features } = useIpFeatures();

  useEffect(() => {
    const firstFeatureWithPath = features?.find((feature) => feature.path);

    if (!firstFeatureWithPath) {
      return;
    }

    const newPath = firstFeatureWithPath.path;

    if (newPath) {
      router.replace(newPath);
    }
  }, [features, router]);

  return <PageLoading />;
};

export default IpLandingRedirect;
