import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import LicensesContainer from '@modules/ip/license-manager/licenses/LicensesContainer';

const LicensesPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <LicensesContainer />
    </Authenticated>
  );
};

LicensesPage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout
    requireRightsAccount
    requireAgreementsManager
    defaultTitle='Heading.Licenses'>
    {page}
  </IpAppNavigationLayout>
);

export default LicensesPage;
