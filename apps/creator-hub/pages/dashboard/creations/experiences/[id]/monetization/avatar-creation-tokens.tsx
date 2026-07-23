import React from 'react';
import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import AvatarCreationTokensPageContentContainer from '@modules/experience-monetization/pages/AvatarCreationTokens/AvatarCreationTokensPageContentContainer';
import { analyticsAvatarCreationTokensNavigationItem } from '@modules/charts-generic';

const AvatarCreationTokensPage: NextLayoutPage = () => {
  return <AvatarCreationTokensPageContentContainer />;
};

AvatarCreationTokensPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsAvatarCreationTokensNavigationItem });

export default AvatarCreationTokensPage;
