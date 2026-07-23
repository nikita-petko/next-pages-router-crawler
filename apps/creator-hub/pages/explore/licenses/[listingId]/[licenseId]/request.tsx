import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import AppNavigationLayout from '@modules/navigation/layout/components/AppLayout';
import Authenticated from '@modules/authentication/Authenticated';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import ApplyToLicenseContainer from '@modules/licenses/containers/ApplyToLicenseContainer';
import IPContainer from '@modules/licenses/containers/IPContainer';

const getLicenseDetailsPageLayout = (page: ReactNode) => (
  <AppNavigationLayout disableLeftNavigation>{page}</AppNavigationLayout>
);

const ApplyToLicense: NextLayoutPage = () => {
  const { translate } = useTranslation();
  const router = useRouter();

  const { listingId, licenseId } = router.query;

  if (!licenseId || !listingId || typeof licenseId !== 'string' || typeof listingId !== 'string') {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
      />
    );
  }

  return (
    <Authenticated>
      <IPContainer>
        <ApplyToLicenseContainer listingId={listingId} licenseId={licenseId} />
      </IPContainer>
    </Authenticated>
  );
};

ApplyToLicense.getPageLayout = getLicenseDetailsPageLayout;

export default ApplyToLicense;
