import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import IpListingEditContainer from '@modules/ip/license-manager/ipListings/IpListingEditContainer';

const IpListingEditPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <IpListingEditContainer />
    </Authenticated>
  );
};

IpListingEditPage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout requireRightsAccount requireAgreementsManager>
    {page}
  </IpAppNavigationLayout>
);

export default IpListingEditPage;
