import { defineFlag } from '@rbx/flags';

// oxlint-disable-next-line typescript-eslint/triple-slash-reference -- generated flags need registry augmentation in type-aware consumers
/// <reference path='./registry.d.ts' />
export const showDevExO18LandingPage = defineFlag({
    namespace: 'creator-business',
    name: 'showDevExO18LandingPage',
    defaultValue: true,
  });
export const showDevExO18LandingPageAnalyticsSection = defineFlag({
    namespace: 'creator-business',
    name: 'showDevExO18LandingPageAnalyticsSection',
    defaultValue: true,
  });
export const isDailyRevenueByBalanceTypeChartEnabled = defineFlag({
    namespace: 'creator-business',
    name: 'isDailyRevenueByBalanceTypeChartEnabled',
    defaultValue: true,
  });
export const isRevenueShareAgreementsEnabled = defineFlag({
    namespace: 'creator-business',
    name: 'isRevenueShareAgreementsEnabled',
    defaultValue: false,
  });
export const enableVirtualTransactionsTab = defineFlag({
    namespace: 'creator-business',
    name: 'enableVirtualTransactionsTab',
    defaultValue: false,
  });
