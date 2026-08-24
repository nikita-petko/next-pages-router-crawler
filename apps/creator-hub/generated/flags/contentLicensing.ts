import { defineFlag } from '@rbx/flags';

// oxlint-disable-next-line typescript-eslint/triple-slash-reference -- generated flags need registry augmentation in type-aware consumers
/// <reference path='./registry.d.ts' />
export const isExperiencePreviewEnabled = defineFlag({
    namespace: 'content-licensing',
    name: 'isExperiencePreviewEnabled',
    defaultValue: true,
  });
export const enableIpPlatformLicenseRecommendations = defineFlag({
    namespace: 'content-licensing',
    name: 'enableIpPlatformLicenseRecommendations',
    defaultValue: false,
  });
export const isIpLicensingEarningsEnabled = defineFlag({
    namespace: 'content-licensing',
    name: 'isIpLicensingEarningsEnabled',
    defaultValue: false,
  });
export const isImageAttachmentEnabledInLicenseApplication = defineFlag({
    namespace: 'content-licensing',
    name: 'isImageAttachmentEnabledInLicenseApplication',
    defaultValue: false,
  });
export const isShowcaseExperiencesEnabled = defineFlag({
    namespace: 'content-licensing',
    name: 'isShowcaseExperiencesEnabled',
    defaultValue: false,
  });
export const isIgnoreMatchEnabled = defineFlag({
    namespace: 'content-licensing',
    name: 'isIgnoreMatchEnabled',
    defaultValue: true,
  });
export const isAvatarItemLicensingEnabled = defineFlag({
    namespace: 'content-licensing',
    name: 'isAvatarItemLicensingEnabled',
    defaultValue: false,
  });
export const isInGameSalesLicensingEnabled = defineFlag({
    namespace: 'content-licensing',
    name: 'isInGameSalesLicensingEnabled',
    defaultValue: false,
  });
export const isIphInGameSalesAvatarMarketplaceSalesLicenseCreationEnabled = defineFlag({
    namespace: 'content-licensing',
    name: 'isIphInGameSalesAvatarMarketplaceSalesLicenseCreationEnabled',
    defaultValue: false,
  });
