import React, { Suspense } from 'react';
import type { NextLayoutPage } from 'next';

import Authenticated from '@modules/authentication/Authenticated';
import PageLoading from '@modules/miscellaneous/common/components/PageLoading';
import getServiceEfficiencyPageLayoutGenerator from '@modules/cloud-services/pricing/components/ServiceEfficiencyCustomSettings/getServiceEfficiencyPageLayout';
import { useServiceEfficiencyCustomSettings } from '@modules/cloud-services/pricing/components/ServiceEfficiencyCustomSettings/ServiceEfficiencyCustomSettings';
import { isValidBillingDateString } from '@modules/cloud-services/utils/common';
import PageNotFound from '@modules/miscellaneous/error/components/PageNotFound';

const BillingStatementLeftNavigation = React.lazy(
  () =>
    import(
      '@modules/cloud-services/pricing/components/BillingStatementLeftNavigation/BillingStatementLeftNavigation'
    ),
);

const BillingStatementPageContainer = React.lazy(
  () =>
    import(
      '@modules/cloud-services/pricing/pages/BillingStatementPageContainer/BillingStatementPageContainer'
    ),
);

const billingLeftNav = (
  <Suspense fallback={<PageLoading />}>
    <BillingStatementLeftNavigation />
  </Suspense>
);

const BillingStatement: NextLayoutPage = () => {
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
        <BillingStatementPageContainer />
      </Suspense>
    </Authenticated>
  );
};

BillingStatement.getPageLayout = (page, { query: { date } }) => {
  const title =
    typeof date === 'string' && isValidBillingDateString(date)
      ? 'Heading.BillingStatement'
      : 'Heading.PendingUsage';

  return getServiceEfficiencyPageLayoutGenerator({ leftNavigationContents: billingLeftNav, title })(
    page,
  );
};

export default BillingStatement;
