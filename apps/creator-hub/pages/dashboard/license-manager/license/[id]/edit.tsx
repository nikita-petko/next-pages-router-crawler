import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import LicenseEditContainer from '@modules/ip/license-manager/ipListings/LicenseEditContainer';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';

const LicenseEditPage: NextLayoutPage = () => {
  const { translate } = useTranslation();
  const router = useRouter();

  const { id } = router.query;

  if (!id || typeof id !== 'string') {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
      />
    );
  }

  return (
    <Authenticated>
      <LicenseEditContainer licenseId={id} />
    </Authenticated>
  );
};

LicenseEditPage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout requireRightsAccount requireAgreementsManager>
    {page}
  </IpAppNavigationLayout>
);

export default LicenseEditPage;
