export enum EligibilityType {
  PricedAssets = 'priced-assets',
  AudioDistribution = 'audio-distribution',
  PaidAccess = 'paid-access',
  AffiliateProgram = 'affiliate-program',
  ExtendedServices = 'extended-services',
  CreatorRewards = 'creator-rewards',
  PublishingPermissions = 'publishing-permissions',
  UsO18DevexRate = 'us-o18-devex-rate',
}

export const eligibilityTypes = [
  {
    key: EligibilityType.UsO18DevexRate,
    title: 'Heading.DevExO18UsSettingsNav',
    content: 'Description.DevExO18UsSettingsNav',
  },
  {
    key: EligibilityType.PublishingPermissions,
    title: 'Heading.PublishingPermissions',
    content: 'Description.PublishingPermissions',
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
