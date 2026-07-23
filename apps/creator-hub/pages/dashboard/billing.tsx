import React, { Suspense } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getServiceEfficiencyPageLayoutGenerator from '@modules/cloud-services/pricing/components/ServiceEfficiencyCustomSettings/getServiceEfficiencyPageLayout';
import { useServiceEfficiencyCustomSettings } from '@modules/cloud-services/pricing/components/ServiceEfficiencyCustomSettings/ServiceEfficiencyCustomSettings';
import FinanceRail from '@modules/finance/FinanceRail';
import PageLoading from '@modules/miscellaneous/components/PageLoading';
import PageNotFound from '@modules/miscellaneous/error/components/PageNotFound';

const AccountActivitiesPageContainer = React.lazy(
  () =>
    import('@modules/cloud-services/pricing/pages/AccountActivitiesPageContainer/AccountActivitiesPageContainer'),
);

const AccountActivityProvider = React.lazy(
  () =>
    import('@modules/cloud-services/pricing/components/AccountActivityProvider/AccountActivityProvider'),
);

const Billing: NextLayoutPage = () => {
  const { isUserEligibleForServiceEfficiency, isFetched } = useServiceEfficiencyCustomSettings();
  if (!isFetched) {
    return <PageLoading />;
  }
  if (!isUserEligibleForServiceEfficiency) {
    return <PageNotFound />;
  }
  return (
    <Authenticated>
      <Suspense fallback={<PageLoading />}>
        <AccountActivityProvider>
          <AccountActivitiesPageContainer />
        </AccountActivityProvider>
      </Suspense>
    </Authenticated>
  );
};

Billing.getPageLayout = getServiceEfficiencyPageLayoutGenerator({
  title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Billing' />,
  secondaryRail: <FinanceRail />,
});
Billing.loggerConfig = { rosId: RosTeams.CreatorEconomy };

export default Billing;
