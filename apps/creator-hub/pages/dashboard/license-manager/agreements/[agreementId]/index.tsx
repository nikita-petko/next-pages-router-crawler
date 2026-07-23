import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import IphAgreementDetailsContainer from '@modules/ip/license-manager/agreements/IphAgreementDetailsContainer';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';

const AgreementsPage: NextLayoutPage = () => {
  const { translate } = useTranslation();
  const router = useRouter();

  const { agreementId } = router.query;

  if (!agreementId || typeof agreementId !== 'string') {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
      />
    );
  }

  return (
    <Authenticated>
      <IphAgreementDetailsContainer agreementId={agreementId} />
    </Authenticated>
  );
};

AgreementsPage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout requireRightsAccount requireAgreementsManager>
    {page}
  </IpAppNavigationLayout>
);

export default AgreementsPage;
