import React, { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';

/**
 * RedirectAccountPage redirects to removal requests (and later, claims).
 * Once our communications are updated, we can stop hosting the /accounts url path.
 */
const RedirectAccountPage: NextLayoutPage = () => {
  const router = useRouter();
  router.push('/dashboard/rights-manager/removal-requests');
  return null;
};

RedirectAccountPage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout defaultTitle='Heading.RemovalRequests'>{page}</IpAppNavigationLayout>
);

export default RedirectAccountPage;
