import React, { ReactNode } from 'react';
import { AnalyticsHomePageWrapper } from '@modules/experience-analytics-shared';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';

export default function getAnalyticsHomePageLayout(page: NonNullable<ReactNode>) {
  return (
    <IALayoutExperiment title='Heading.Analytics' noBreadCrumbs>
      <AnalyticsHomePageWrapper>{page}</AnalyticsHomePageWrapper>
    </IALayoutExperiment>
  );
}
