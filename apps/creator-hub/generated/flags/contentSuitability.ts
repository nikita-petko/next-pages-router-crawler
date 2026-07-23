import { defineFlag } from '@rbx/flags';

// oxlint-disable-next-line typescript-eslint/triple-slash-reference -- generated flags need registry augmentation in type-aware consumers
/// <reference path='./registry.d.ts' />
export const questionnaireV2Allowlist = defineFlag({
    namespace: 'content-suitability',
    name: 'questionnaireV2Allowlist',
    defaultValue: false,
  });
export const questionnaireV2Q1Release = defineFlag({
    namespace: 'content-suitability',
    name: 'questionnaireV2Q1Release',
    defaultValue: false,
  });
