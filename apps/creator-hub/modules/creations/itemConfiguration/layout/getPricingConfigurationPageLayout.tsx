import type { ReactNode } from 'react';
import React from 'react';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';

export default function getPricingConfigurationPageLayout(page: ReactNode) {
  return <CreatorHubLayout>{page}</CreatorHubLayout>;
}
