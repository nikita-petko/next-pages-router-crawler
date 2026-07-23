import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import LicenseMatchesContainer from '@modules/ip/license-manager/agreements/MatchesContainer';

const AgreementsPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <LicenseMatchesContainer />
    </Authenticated>
  );
};

AgreementsPage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout
    requireRightsAccount
    requireAgreementsManager
    defaultTitle='Heading.Matches'>
    {page}
  </IpAppNavigationLayout>
);

export default AgreementsPage;
