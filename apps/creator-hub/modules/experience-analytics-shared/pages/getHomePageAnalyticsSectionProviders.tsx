import type { ReactNode } from 'react';
import React from 'react';
import AnalyticsOwnerOverrideProvider from '../context/AnalyticsOwnerOverrideProvider';
import RAQIV2ClientProvider from '../context/RAQIV2ClientProvider';

export default function getHomePageAnalyticsSectionProviders(page: NonNullable<ReactNode>) {
  return (
    <AnalyticsOwnerOverrideProvider>
      <RAQIV2ClientProvider>{page}</RAQIV2ClientProvider>
    </AnalyticsOwnerOverrideProvider>
  );
}
