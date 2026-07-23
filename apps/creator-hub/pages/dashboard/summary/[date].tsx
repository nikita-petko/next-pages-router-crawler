import React, { Suspense } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getServiceEfficiencyPageLayoutGenerator from '@modules/cloud-services/pricing/components/ServiceEfficiencyCustomSettings/getServiceEfficiencyPageLayout';
import { useServiceEfficiencyCustomSettings } from '@modules/cloud-services/pricing/components/ServiceEfficiencyCustomSettings/ServiceEfficiencyCustomSettings';
import { isValidBillingDateString } from '@modules/cloud-services/utils/common';
import PageLoading from '@modules/miscellaneous/components/PageLoading';
import PageNotFound from '@modules/miscellaneous/error/components/PageNotFound';

const BillingStatementLeftNavigation = React.lazy(
  () =>
    import('@modules/cloud-services/pricing/components/BillingStatementLeftNavigation/BillingStatementLeftNavigation'),
);

const BillingStatementPageContainer = React.lazy(
  () =>
    import('@modules/cloud-services/pricing/pages/BillingStatementPageContainer/BillingStatementPageContainer'),
);

const billingLeftNav = (
  <Suspense fallback={<PageLoading />}>
    <BillingStatementLeftNavigation />
  </Suspense>
);

const billingStatementTitle = (
  <Translate namespace='CreatorDashboard.CloudServices' translationKey='Heading.BillingStatement' />
);

const pendingUsageTitle = (
  <Translate namespace='CreatorDashboard.CloudServices' translationKey='Heading.PendingUsage' />
);

const getBillingStatementLayout = getServiceEfficiencyPageLayoutGenerator({
  leftNavigationContents: billingLeftNav,
  title: billingStatementTitle,
});

const getPendingUsageLayout = getServiceEfficiencyPageLayoutGenerator({
  leftNavigationContents: billingLeftNav,
  title: pendingUsageTitle,
});

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
  const getLayout =
    typeof date === 'string' && isValidBillingDateString(date)
      ? getBillingStatementLayout
      : getPendingUsageLayout;
  return getLayout(page);
};
BillingStatement.loggerConfig = { rosId: RosTeams.Analytics };

export default BillingStatement;
