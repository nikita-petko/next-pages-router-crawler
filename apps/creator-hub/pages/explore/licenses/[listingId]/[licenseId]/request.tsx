import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import ApplyToLicenseContainer from '@modules/licenses/containers/ApplyToLicenseContainer';
import IPContainer from '@modules/licenses/containers/IPContainer';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';

const getLicenseDetailsPageLayout = (page: ReactNode) => (
  <CreatorHubLayout
    disableLeftNavigation
    noBreadCrumbs
    title={
      <Translate namespace='CreatorDashboard.Licenses' translationKey='Heading.RequestLicense' />
    }>
    {page}
  </CreatorHubLayout>
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
        <ToolboxServiceApiProvider>
          <ApplyToLicenseContainer listingId={listingId} licenseId={licenseId} />
        </ToolboxServiceApiProvider>
      </IPContainer>
    </Authenticated>
  );
};

ApplyToLicense.getPageLayout = getLicenseDetailsPageLayout;
ApplyToLicense.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default ApplyToLicense;
