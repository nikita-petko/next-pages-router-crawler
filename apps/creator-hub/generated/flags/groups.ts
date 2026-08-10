import { defineFlag } from '@rbx/flags';

// oxlint-disable-next-line typescript-eslint/triple-slash-reference -- generated flags need registry augmentation in type-aware consumers
/// <reference path='./registry.d.ts' />
export const isUnifiedUiEnabled = defineFlag({
    namespace: 'groups',
    name: 'isUnifiedUiEnabled',
    defaultValue: false,
  });
