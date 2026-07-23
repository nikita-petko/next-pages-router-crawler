import { defineFlag } from '@rbx/flags';

// oxlint-disable-next-line typescript-eslint/triple-slash-reference -- generated flags need registry augmentation in type-aware consumers
/// <reference path='./registry.d.ts' />
export const mockManagedPricingSummary = defineFlag({
    namespace: 'monetization',
    name: 'mockManagedPricingSummary',
    defaultValue: false,
  });
export const mockManagedPricingEvents = defineFlag({
    namespace: 'monetization',
    name: 'mockManagedPricingEvents',
    defaultValue: false,
  });
export const mockHardCodedPrices = defineFlag({
    namespace: 'monetization',
    name: 'mockHardCodedPrices',
    defaultValue: false,
  });
export const mockManagedPricingProductWrites = defineFlag({
    namespace: 'monetization',
    name: 'mockManagedPricingProductWrites',
    defaultValue: false,
  });
export const isProductArchiveEnabled = defineFlag({
    namespace: 'monetization',
    name: 'isProductArchiveEnabled',
    defaultValue: false,
  });
