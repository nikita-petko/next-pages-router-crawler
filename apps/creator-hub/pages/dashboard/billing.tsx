import React, { Suspense } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import PageLoading from '@modules/miscellaneous/common/components/PageLoading';
import getServiceEfficiencyPageLayoutGenerator from '@modules/cloud-services/pricing/components/ServiceEfficiencyCustomSettings/getServiceEfficiencyPageLayout';
import { useServiceEfficiencyCustomSettings } from '@modules/cloud-services/pricing/components/ServiceEfficiencyCustomSettings/ServiceEfficiencyCustomSettings';
import PageNotFound from '@modules/miscellaneous/error/components/PageNotFound';
import FinanceRail from '@modules/finance/FinanceRail';

const AccountActivitiesPageContainer = React.lazy(
  () =>
    import(
      '@modules/cloud-services/pricing/pages/AccountActivitiesPageContainer/AccountActivitiesPageContainer'
    ),
);

const AccountActivityProvider = React.lazy(
  () =>
    import(
      '@modules/cloud-services/pricing/components/AccountActivityProvider/AccountActivityProvider'
    ),
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
  title: 'Heading.Billing',
  secondaryRail: <FinanceRail />,
});

export default Billing;
