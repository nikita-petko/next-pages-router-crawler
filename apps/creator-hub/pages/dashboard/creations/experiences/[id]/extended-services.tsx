import React, { Suspense } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import CloudPricingClientProvider from '@modules/cloud-services/pricing/CloudPricingClientProvider';
import { useCreationsCustomSettings } from '@modules/creations/common/implementations/creationsCustomSettings';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import PageLoading from '@modules/miscellaneous/components/PageLoading';

const UnlockServicePageContainer = React.lazy(
  () =>
    import('@modules/cloud-services/pricing/pages/UnlockServicePageContainer/UnlockServicePageContainer'),
);

const ServiceLimit: NextLayoutPage = () => {
  const { isFetched } = useCreationsCustomSettings();
  if (!isFetched) {
    return <PageLoading />;
  }

  return (
    <Authenticated>
      <Suspense fallback={<PageLoading />}>
        <CloudPricingClientProvider>
          <UnlockServicePageContainer />
        </CloudPricingClientProvider>
      </Suspense>
    </Authenticated>
  );
};

ServiceLimit.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: (
      <Translate
        namespace='CreatorDashboard.PageTitles'
        translationKey='Heading.ServiceEfficiency'
      />
    ),
    beta: true,
  });
ServiceLimit.loggerConfig = { rosId: RosTeams.CreatorEconomy };

export default ServiceLimit;
