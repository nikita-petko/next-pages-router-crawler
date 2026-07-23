import { defineFlag } from '@rbx/flags';

// oxlint-disable-next-line typescript-eslint/triple-slash-reference -- generated flags need registry augmentation in type-aware consumers
/// <reference path='./registry.d.ts' />
export const shouldUseWatermarkFiatCalculation = defineFlag({
    namespace: 'devex',
    name: 'shouldUseWatermarkFiatCalculation',
    defaultValue: false,
  });
export const isTaxDocumentationEnabled = defineFlag({
    namespace: 'devex',
    name: 'isTaxDocumentationEnabled',
    defaultValue: false,
  });
