import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import RedirectContainer from '@modules/ip/license-manager/RedirectContainer';

const LicenseManager: NextLayoutPage = () => {
  return (
    <Authenticated>
      <RedirectContainer />
    </Authenticated>
  );
};

LicenseManager.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout>{page}</IpAppNavigationLayout>
);

export default LicenseManager;
