import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import LicenseCreateContainer from '@modules/ip/license-manager/ipListings/LicenseCreateContainer';

const LicenseCreatePage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <LicenseCreateContainer />
    </Authenticated>
  );
};

LicenseCreatePage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout requireRightsAccount requireAgreementsManager>
    {page}
  </IpAppNavigationLayout>
);
LicenseCreatePage.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default LicenseCreatePage;
