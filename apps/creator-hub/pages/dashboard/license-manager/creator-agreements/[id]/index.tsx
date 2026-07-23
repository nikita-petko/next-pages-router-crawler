import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import { ContentLicensingCustomSettingsProvider } from '@modules/ip/common/implementations/contentLicensingCustomSettings';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import CreatorAgreementDetailsContainer from '@modules/ip/license-manager/creatorAgreements/CreatorAgreementDetailsContainer';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';

const AgreementDetailsPage: NextLayoutPage = () => {
  const router = useRouter();
  const { translate } = useTranslation();
  const { id } = router.query;

  if (typeof id !== 'string') {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
      />
    );
  }

  return (
    <Authenticated>
      <ContentLicensingCustomSettingsProvider>
        <CreatorAgreementDetailsContainer agreementId={id} />
      </ContentLicensingCustomSettingsProvider>
    </Authenticated>
  );
};

AgreementDetailsPage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout requireRightsAccount>{page}</IpAppNavigationLayout>
);
AgreementDetailsPage.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default AgreementDetailsPage;
