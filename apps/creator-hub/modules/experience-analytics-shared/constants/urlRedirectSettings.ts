import { AnalyticsQueryParams } from '@modules/charts-generic';
import { urls } from '@modules/miscellaneous/common';
import { NextRouter } from 'next/router';

type AnalyticsRouterQueryParams = AnalyticsQueryParams | 'id';

export type TUrlRedirectSetting = {
  oldUrl: string;
  getNewUrl: (query: NextRouter['query']) => string | null;
  preserveQueryParams: boolean;
  queryParamsToIgnore?: AnalyticsRouterQueryParams[];
};

const urlRedirectSettings: TUrlRedirectSetting[] = [
  {
    oldUrl: '/dashboard/creations/experiences/[id]/stats',
    getNewUrl: (query) =>
      urls.creatorHub.dashboard.getAnalyticsPerformanceClientUrl(Number(query.id)),
    preserveQueryParams: true,
    queryParamsToIgnore: ['id'],
  },
  {
    oldUrl: '/dashboard/creations/experiences/[id]/analytics/monetization',
    getNewUrl: (query) => urls.creatorHub.dashboard.getMonetizationOverviewUrl(Number(query.id)),
    preserveQueryParams: true,
    queryParamsToIgnore: ['id'],
  },
  {
    oldUrl: '/dashboard/creations/experiences/[id]/associated-items',
    getNewUrl: (query) => {
      const universeId = Number(query.id);
      switch (query.activeTab) {
        case 'DeveloperProduct':
          return urls.creatorHub.dashboard.getMonetizationDeveloperProductsUrl(universeId);
        case 'Pass':
          return urls.creatorHub.dashboard.getMonetizationPassesUrl(universeId);
        case 'CatalogAsset':
          return urls.creatorHub.dashboard.getMonetizationAvatarItemsUrl(universeId);
        case 'Subscription':
          return urls.creatorHub.dashboard.getMonetizationSubscriptionsUrl(universeId);
        default:
          // NOTE(shumingxu, 11/28/2023): don't redirect other items
          return null;
      }
    },
    preserveQueryParams: false,
  },
  {
    oldUrl: '/dashboard/creations/experiences/[id]/analytics/immersive-ads',
    getNewUrl: (query) =>
      urls.creatorHub.dashboard.getMonetizationImmersiveAdsUrl(Number(query.id)),
    preserveQueryParams: true,
    queryParamsToIgnore: ['id'],
  },
  {
    oldUrl: '/dashboard/creations/experiences/[id]/analytics/experience-subscriptions',
    getNewUrl: (query) =>
      urls.creatorHub.dashboard.getMonetizationSubscriptionsUrl(Number(query.id)),
    preserveQueryParams: true,
    queryParamsToIgnore: ['id'],
  },
];

export default urlRedirectSettings;
