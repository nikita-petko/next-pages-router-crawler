import React from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsItemMonetizationAvatarItemsNavigationItem } from '@modules/charts-generic';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import AvatarItemsPageContentContainer from '@modules/experience-monetization/pages/AvatarItems/AvatarItemsPageContentContainer';

const AvatarItemsPage: NextLayoutPage = () => {
  return <AvatarItemsPageContentContainer />;
};

AvatarItemsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsItemMonetizationAvatarItemsNavigationItem,
  });

export default AvatarItemsPage;
