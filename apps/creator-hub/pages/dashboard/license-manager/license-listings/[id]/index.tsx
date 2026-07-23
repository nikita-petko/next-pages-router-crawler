import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import IpListingDetailsContainer from '@modules/ip/license-manager/ipListings/IpListingDetailsContainer';

const IpListingsDetailsPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <IpListingDetailsContainer />
    </Authenticated>
  );
};

IpListingsDetailsPage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout requireRightsAccount requireAgreementsManager>
    {page}
  </IpAppNavigationLayout>
);
IpListingsDetailsPage.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default IpListingsDetailsPage;
