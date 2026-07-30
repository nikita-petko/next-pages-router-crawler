import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import { ContentLicensingCustomSettingsProvider } from '@modules/ip/common/implementations/contentLicensingCustomSettings';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import CreatorAgreementsContainer from '@modules/ip/license-manager/creatorAgreements/CreatorAgreementsContainer';

const CreatorAgreementsPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ContentLicensingCustomSettingsProvider>
        <CreatorAgreementsContainer />
      </ContentLicensingCustomSettingsProvider>
    </Authenticated>
  );
};

CreatorAgreementsPage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout
    defaultTitle={
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Licenses' />
    }>
    {page}
  </IpAppNavigationLayout>
);
CreatorAgreementsPage.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default CreatorAgreementsPage;
