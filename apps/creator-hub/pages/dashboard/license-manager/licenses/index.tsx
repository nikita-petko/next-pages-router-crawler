import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
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
    defaultTitle={
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Licenses' />
    }>
    {page}
  </IpAppNavigationLayout>
);
LicensesPage.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default LicensesPage;
