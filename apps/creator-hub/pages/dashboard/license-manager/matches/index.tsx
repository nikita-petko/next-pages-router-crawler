import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
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
    defaultTitle={
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Matches' />
    }>
    {page}
  </IpAppNavigationLayout>
);
AgreementsPage.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default AgreementsPage;
