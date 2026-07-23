import type { FunctionComponent, ReactNode } from 'react';
import React from 'react';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import { useServiceEfficiencyCustomSettings } from './ServiceEfficiencyCustomSettings';

const ServiceEfficiencyPageLayout: FunctionComponent<{
  leftNavigationContents?: ReactNode;
  secondaryRail?: ReactNode;
  title?: string | ReactNode;
  children?: React.ReactNode;
}> = ({ leftNavigationContents, secondaryRail, title, children }) => {
  const { isUserEligibleForServiceEfficiency, isFetched } = useServiceEfficiencyCustomSettings();
  return (
    <CreatorHubLayout
      title={title}
      beta
      noBreadCrumbs
      leftNavigationContents={leftNavigationContents}
      secondaryRail={secondaryRail}
      secondarySize='small'
      disableLeftNavigation={!isFetched || !isUserEligibleForServiceEfficiency}>
      {children}
    </CreatorHubLayout>
  );
};

export default React.memo(ServiceEfficiencyPageLayout);
