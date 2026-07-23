import React, { Suspense } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import PageLoading from '@modules/miscellaneous/common/components/PageLoading';
import CloudPricingClientProvider from '@modules/cloud-services/pricing/CloudPricingClientProvider';
import getServiceEfficiencyPageLayoutGenerator from '@modules/cloud-services/pricing/components/ServiceEfficiencyCustomSettings/getServiceEfficiencyPageLayout';
import { useServiceEfficiencyCustomSettings } from '@modules/cloud-services/pricing/components/ServiceEfficiencyCustomSettings/ServiceEfficiencyCustomSettings';
import PageNotFound from '@modules/miscellaneous/error/components/PageNotFound';
import FinanceRail from '@modules/finance/FinanceRail';

const PaymentsPageContainer = React.lazy(
  () => import('@modules/cloud-services/pricing/pages/PaymentsPageContainer/PaymentsPageContainer'),
);

const Payments: NextLayoutPage = () => {
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
        <CloudPricingClientProvider>
          <PaymentsPageContainer />
        </CloudPricingClientProvider>
      </Suspense>
    </Authenticated>
  );
};

Payments.getPageLayout = getServiceEfficiencyPageLayoutGenerator({
  secondaryRail: <FinanceRail />,
  title: 'Heading.Payments',
});

export default Payments;
