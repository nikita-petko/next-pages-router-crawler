import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import RecommendedLicensesBanner from '@modules/licenses/components/RecommendedLicensesBanner';
import IPContainer from '@modules/licenses/containers/IPContainer';
import LicensesContainer from '@modules/licenses/containers/LicensesContainer';

const getLicensesPageLayout = (page: ReactNode) => (
  <CreatorHubLayout
    disableLeftNavigation
    noBreadCrumbs
    pageBanner={<RecommendedLicensesBanner />}
    title={<Translate namespace='CreatorDashboard.Licenses' translationKey='Heading.Licenses' />}>
    {page}
  </CreatorHubLayout>
);

const Licenses: NextLayoutPage = () => {
  return (
    <IPContainer>
      <LicensesContainer />
    </IPContainer>
  );
};

Licenses.getPageLayout = getLicensesPageLayout;
Licenses.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default Licenses;
