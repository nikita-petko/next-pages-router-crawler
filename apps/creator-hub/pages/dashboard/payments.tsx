import React, { Suspense } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import CloudPricingClientProvider from '@modules/cloud-services/pricing/CloudPricingClientProvider';
import getServiceEfficiencyPageLayoutGenerator from '@modules/cloud-services/pricing/components/ServiceEfficiencyCustomSettings/getServiceEfficiencyPageLayout';
import { useServiceEfficiencyCustomSettings } from '@modules/cloud-services/pricing/components/ServiceEfficiencyCustomSettings/ServiceEfficiencyCustomSettings';
import FinanceRail from '@modules/finance/FinanceRail';
import PageLoading from '@modules/miscellaneous/components/PageLoading';
import PageNotFound from '@modules/miscellaneous/error/components/PageNotFound';

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
  title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Payments' />,
});
Payments.loggerConfig = { rosId: RosTeams.CreatorEconomy };

export default Payments;
