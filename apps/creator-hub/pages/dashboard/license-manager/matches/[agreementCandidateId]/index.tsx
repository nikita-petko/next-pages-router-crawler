import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import IphMatchDetailsContainer from '@modules/ip/license-manager/agreements/IphMatchDetailsContainer';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';

const MatchDetailsPage: NextLayoutPage = () => {
  const { translate } = useTranslation();
  const router = useRouter();

  const { agreementCandidateId } = router.query;

  if (!agreementCandidateId || typeof agreementCandidateId !== 'string') {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
      />
    );
  }

  return (
    <Authenticated>
      <IphMatchDetailsContainer agreementCandidateId={agreementCandidateId} />
    </Authenticated>
  );
};

MatchDetailsPage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout requireRightsAccount requireAgreementsManager>
    {page}
  </IpAppNavigationLayout>
);
MatchDetailsPage.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default MatchDetailsPage;
