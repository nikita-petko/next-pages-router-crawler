import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import CreatorAgreementDetailsContainer from '@modules/ip/license-manager/creatorAgreements/CreatorAgreementDetailsContainer';
import { ContentLicensingCustomSettingsProvider } from '@modules/ip/common/implementations/contentLicensingCustomSettings';
import { useRouter } from 'next/router';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { useTranslation } from '@rbx/intl';

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

export default AgreementDetailsPage;
