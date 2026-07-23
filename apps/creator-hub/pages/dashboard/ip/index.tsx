import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import IpLandingRedirect from '@modules/ip/containers/IpLandingRedirect';

const IpLanding: NextLayoutPage = () => {
  return (
    <Authenticated>
      <IpLandingRedirect />
    </Authenticated>
  );
};

IpLanding.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout>{page}</IpAppNavigationLayout>
);

export default IpLanding;
