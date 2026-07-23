import React, { FunctionComponent, ReactNode } from 'react';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import { useServiceEfficiencyCustomSettings } from './ServiceEfficiencyCustomSettings';

const ServiceEfficiencyPageLayout: FunctionComponent<{
  leftNavigationContents?: ReactNode;
  secondaryRail?: ReactNode;
  title?: string;
  children?: React.ReactNode;
}> = ({ leftNavigationContents, secondaryRail, title, children }) => {
  const { isUserEligibleForServiceEfficiency, isFetched } = useServiceEfficiencyCustomSettings();
  return (
    <IALayoutExperiment
      title={title}
      beta
      noBreadCrumbs
      leftNavigationContents={leftNavigationContents}
      secondaryRail={secondaryRail}
      secondarySize='small'
      disableLeftNavigation={!isFetched || !isUserEligibleForServiceEfficiency}>
      {children}
    </IALayoutExperiment>
  );
};

export default React.memo(ServiceEfficiencyPageLayout);
