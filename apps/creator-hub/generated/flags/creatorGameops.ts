import { defineFlag } from '@rbx/flags';

// oxlint-disable-next-line typescript-eslint/triple-slash-reference -- generated flags need registry augmentation in type-aware consumers
/// <reference path='./registry.d.ts' />
export const enablePlayerSupport = defineFlag({
    namespace: 'creator-gameops',
    name: 'enablePlayerSupport',
    defaultValue: false,
  });
export const enablePlayerSupportSearchAndFilters = defineFlag({
    namespace: 'creator-gameops',
    name: 'enablePlayerSupportSearchAndFilters',
    defaultValue: false,
  });
export const enableExpeditedReview = defineFlag({
    namespace: 'creator-gameops',
    name: 'enableExpeditedReview',
    defaultValue: false,
  });
