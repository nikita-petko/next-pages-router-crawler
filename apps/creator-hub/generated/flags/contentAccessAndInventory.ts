import { defineFlag } from '@rbx/flags';

// oxlint-disable-next-line typescript-eslint/triple-slash-reference -- generated flags need registry augmentation in type-aware consumers
/// <reference path='./registry.d.ts' />
export const isAssetPrivacyOptOutSurveyEnabled = defineFlag({
    namespace: 'content-access-and-inventory',
    name: 'isAssetPrivacyOptOutSurveyEnabled',
    defaultValue: false,
  });
export const isAssetAccessRequestsEnabled = defineFlag({
    namespace: 'content-access-and-inventory',
    name: 'isAssetAccessRequestsEnabled',
    defaultValue: false,
  });
export const isModelCustomThumbnailUploadEnabled = defineFlag({
    namespace: 'content-access-and-inventory',
    name: 'isModelCustomThumbnailUploadEnabled',
    defaultValue: false,
  });
