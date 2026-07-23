import type { ReactNode } from 'react';
import React from 'react';
import CloudPricingClientProvider from '../../CloudPricingClientProvider';
import { ServiceEfficiencyCustomSettingsProvider } from './ServiceEfficiencyCustomSettings';
import ServiceEfficiencyPageLayout from './ServiceEfficiencyPageLayout';

export default function getServiceEfficiencyPageLayoutGenerator({
  leftNavigationContents,
  title,
  secondaryRail,
}: {
  leftNavigationContents?: ReactNode;
  title?: string | ReactNode;
  secondaryRail?: ReactNode;
}) {
  const getServiceEfficiencyPageLayout = (page: ReactNode) => (
    <ServiceEfficiencyCustomSettingsProvider>
      <CloudPricingClientProvider>
        <ServiceEfficiencyPageLayout
          title={title}
          leftNavigationContents={leftNavigationContents}
          secondaryRail={secondaryRail}>
          {page}
        </ServiceEfficiencyPageLayout>
      </CloudPricingClientProvider>
    </ServiceEfficiencyCustomSettingsProvider>
  );
  return getServiceEfficiencyPageLayout;
}
