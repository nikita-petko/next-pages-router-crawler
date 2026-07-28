import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';

export enum InventorySelectionType {
  FixedQuantity = 'fixed-quantity',
  MerchOnDemand = 'merch-on-demand',
  PreOrder = 'pre-order',
}

export enum CommerceTranslationKeys {
  FixedQuantity = 'Label.FixedQuantity',
  MerchOnDemand = 'Label.MerchOnDemand',
  PreOrder = 'Label.PreOrder',
  BundlingFee = 'Label.BundlingFee',
  InReview = 'Label.InReview',
  Moderation = 'Label.Moderation',
  PendingBundlingFee = 'Label.CalculatingBundlingFee',
  AcceptBundlingFee = 'Label.AcceptBundlingFee',
}

export const CommerceDocLinks: AnalyticsDocLink[] = [
  '/docs/production/monetization/commerce-products',
];

export default { InventorySelectionType, CommerceTranslationKeys, CommerceDocLinks };
