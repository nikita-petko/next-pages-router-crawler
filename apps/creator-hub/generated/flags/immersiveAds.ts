import { defineFlag } from '@rbx/flags';

// oxlint-disable-next-line typescript-eslint/triple-slash-reference -- generated flags need registry augmentation in type-aware consumers
/// <reference path='./registry.d.ts' />
export const isRewardedVideoRedesignEnabled = defineFlag({
    namespace: 'immersive-ads',
    name: 'isRewardedVideoRedesignEnabled',
    defaultValue: true,
  });
