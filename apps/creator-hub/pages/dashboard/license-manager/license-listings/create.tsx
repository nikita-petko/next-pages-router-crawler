import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import IpListingsCreateContainer from '@modules/ip/license-manager/ipListings/IpListingsCreateContainer';

const IpListingCreatePage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <IpListingsCreateContainer />
    </Authenticated>
  );
};

IpListingCreatePage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout requireRightsAccount requireAgreementsManager>
    {page}
  </IpAppNavigationLayout>
);
IpListingCreatePage.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default IpListingCreatePage;
