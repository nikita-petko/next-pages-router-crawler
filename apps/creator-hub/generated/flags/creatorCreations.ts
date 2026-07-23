import { defineFlag } from '@rbx/flags';

// oxlint-disable-next-line typescript-eslint/triple-slash-reference -- generated flags need registry augmentation in type-aware consumers
/// <reference path='./registry.d.ts' />
export const isMomentsUploadEnabled = defineFlag({
    namespace: 'creator-creations',
    name: 'isMomentsUploadEnabled',
    defaultValue: false,
  });
export const isMomentsSitetestUrlParsingEnabled = defineFlag({
    namespace: 'creator-creations',
    name: 'isMomentsSitetestUrlParsingEnabled',
    defaultValue: false,
  });
