import React, { ReactNode } from 'react';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';

export default function getPricingConfigurationPageLayout(page: ReactNode) {
  return <IALayoutExperiment>{page}</IALayoutExperiment>;
}
