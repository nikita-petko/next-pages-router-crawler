import type { NextRouter } from 'next/router';
import type AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import { creatorHub } from '@modules/miscellaneous/urls';

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
    getNewUrl: (query) => creatorHub.dashboard.getAnalyticsPerformanceClientUrl(Number(query.id)),
    preserveQueryParams: true,
    queryParamsToIgnore: ['id'],
  },
  {
    oldUrl: '/dashboard/creations/experiences/[id]/analytics/monetization',
    getNewUrl: (query) => creatorHub.dashboard.getMonetizationOverviewUrl(Number(query.id)),
    preserveQueryParams: true,
    queryParamsToIgnore: ['id'],
  },
  {
    oldUrl: '/dashboard/creations/experiences/[id]/associated-items',
    getNewUrl: (query) => {
      const universeId = Number(query.id);
      switch (query.activeTab) {
        case 'DeveloperProduct':
          return creatorHub.dashboard.getMonetizationDeveloperProductsUrl(universeId);
        case 'Pass':
          return creatorHub.dashboard.getMonetizationPassesUrl(universeId);
        case 'CatalogAsset':
          return creatorHub.dashboard.getMonetizationAvatarItemsUrl(universeId);
        case 'Subscription':
          return creatorHub.dashboard.getMonetizationSubscriptionsUrl(universeId);
        case undefined:
        default:
          // NOTE(shumingxu, 11/28/2023): don't redirect other items
          return null;
      }
    },
    preserveQueryParams: false,
  },
  {
    oldUrl: '/dashboard/creations/experiences/[id]/analytics/immersive-ads',
    getNewUrl: (query) => creatorHub.dashboard.getMonetizationImmersiveAdsUrl(Number(query.id)),
    preserveQueryParams: true,
    queryParamsToIgnore: ['id'],
  },
  {
    oldUrl: '/dashboard/creations/experiences/[id]/analytics/experience-subscriptions',
    getNewUrl: (query) => creatorHub.dashboard.getMonetizationSubscriptionsUrl(Number(query.id)),
    preserveQueryParams: true,
    queryParamsToIgnore: ['id'],
  },
  {
    oldUrl: '/dashboard/creations/experiences/[id]/analytics/ai-chat',
    getNewUrl: (query) => creatorHub.dashboard.getAnalyticsAgentUrl(Number(query.id)),
    preserveQueryParams: true,
    queryParamsToIgnore: ['id'],
  },
];

export default urlRedirectSettings;
