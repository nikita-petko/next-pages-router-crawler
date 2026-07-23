import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import CreatorAgreementsContainer from '@modules/ip/license-manager/creatorAgreements/CreatorAgreementsContainer';
import { ContentLicensingCustomSettingsProvider } from '@modules/ip/common/implementations/contentLicensingCustomSettings';

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
  <IpAppNavigationLayout defaultTitle='Heading.Licenses'>{page}</IpAppNavigationLayout>
);

export default CreatorAgreementsPage;
