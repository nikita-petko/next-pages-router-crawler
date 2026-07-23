import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { PageLoading } from '@modules/miscellaneous/common';
import { LICENSE_MANAGER_BASE_HREF } from './urls';
import useIpFeatures from '../hooks/useIpFeatures';

/**
 * Redirects to the first license-manager feature if it exists, otherwise redirects to the home page.
 */
const RedirectContainer: React.FC = () => {
  const router = useRouter();
  const { flatFeatures: features } = useIpFeatures();

  useEffect(() => {
    if (!features || features.length === 0) {
      return;
    }

    // Search for the first item with 'license-manager' in the path
    const licenseManagerFeature = features.find(
      (feature) => feature.path && feature.path.includes(LICENSE_MANAGER_BASE_HREF),
    );

    if (licenseManagerFeature) {
      router.replace(licenseManagerFeature.path!);
    } else {
      router.replace('/');
    }
  }, [features, router]);

  return <PageLoading />;
};

export default RedirectContainer;
