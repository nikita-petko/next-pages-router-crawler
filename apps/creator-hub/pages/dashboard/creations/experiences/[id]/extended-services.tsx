import React, { Suspense } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreationsPageLayout, useCreationsCustomSettings } from '@modules/creations';
import PageLoading from '@modules/miscellaneous/common/components/PageLoading';
import CloudPricingClientProvider from '@modules/cloud-services/pricing/CloudPricingClientProvider';

const UnlockServicePageContainer = React.lazy(
  () =>
    import(
      '@modules/cloud-services/pricing/pages/UnlockServicePageContainer/UnlockServicePageContainer'
    ),
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
  getCreationsPageLayout(page, { title: 'Heading.ServiceEfficiency', beta: true });

export default ServiceLimit;
