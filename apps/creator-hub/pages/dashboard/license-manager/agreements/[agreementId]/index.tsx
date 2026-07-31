import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import IphAgreementDetailsContainer from '@modules/ip/license-manager/agreements/IphAgreementDetailsContainer';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';

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
      <ToolboxServiceApiProvider>
        <IphAgreementDetailsContainer agreementId={agreementId} />
      </ToolboxServiceApiProvider>
    </Authenticated>
  );
};

AgreementsPage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout requireRightsAccount requireAgreementsManager>
    {page}
  </IpAppNavigationLayout>
);
AgreementsPage.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default AgreementsPage;
