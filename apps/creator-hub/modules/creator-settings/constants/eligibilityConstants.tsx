export enum EligibilityType {
  PricedAssets = 'priced-assets',
  AudioDistribution = 'audio-distribution',
  PaidAccess = 'paid-access',
  AffiliateProgram = 'affiliate-program',
  ExtendedServices = 'extended-services',
  CreatorRewards = 'creator-rewards',
  PublicPublish = 'public-publish',
  PublishingPermissions = 'publishing-permissions',
}

export const eligibilityTypes = [
  {
    key: EligibilityType.PublishingPermissions,
    title: 'Heading.PublishingPermissions',
    content: 'Description.PublishingPermissions',
  },
  {
    key: EligibilityType.PublicPublish,
    title: 'Heading.PublicPublish',
    content: 'Description.PublicPublish',
  },
  {
    key: EligibilityType.PricedAssets,
    title: 'Heading.PricedAssets',
    content: 'Description.PricedAssets',
  },
  {
    key: EligibilityType.AudioDistribution,
    title: 'Heading.AudioDistribution',
    content: 'Description.AudioDistribution',
  },
  {
    key: EligibilityType.PaidAccess,
    title: 'Heading.PaidAccess',
    content: 'Description.PaidAccessFiat',
  },
  {
    key: EligibilityType.ExtendedServices,
    title: 'Heading.ExtendedServices',
    content: 'Description.ExtendedServices',
  },
  {
    key: EligibilityType.CreatorRewards,
    title: 'Heading.CreatorRewards',
    content: 'Description.CreatorRewards',
  },
];
