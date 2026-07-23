import React from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsAudienceNavigationItem } from '@modules/charts-generic';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import ExperienceAnalyticsAudiencePage from '@modules/experience-analytics/pages/AudiencePageRAQI/AudiencePageRAQIContent';

const AudienceAnalyticsPage: NextLayoutPage = () => {
  return <ExperienceAnalyticsAudiencePage />;
};

AudienceAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsAudienceNavigationItem });

export default AudienceAnalyticsPage;
