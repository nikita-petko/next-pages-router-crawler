import { defineFlag } from '@rbx/flags';

// oxlint-disable-next-line typescript-eslint/triple-slash-reference -- generated flags need registry augmentation in type-aware consumers
/// <reference path='./registry.d.ts' />
export const isRevenueShareAgreementsEnabled = defineFlag({
    namespace: 'creator-business',
    name: 'isRevenueShareAgreementsEnabled',
    defaultValue: false,
  });
export const enableVirtualTransactionsTab = defineFlag({
    namespace: 'creator-business',
    name: 'enableVirtualTransactionsTab',
    defaultValue: true,
  });
