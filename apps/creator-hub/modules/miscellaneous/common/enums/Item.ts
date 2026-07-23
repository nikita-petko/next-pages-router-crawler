enum Item {
  Game = 'Game',
  Bundle = 'Bundle',
  CatalogAsset = 'CatalogAsset',
  LibraryAsset = 'LibraryAsset',
  GamePass = 'Pass',
  Badge = 'Badge',
  DeveloperProduct = 'DeveloperProduct',
  TranslatorGame = 'TranslatorGame',
  Places = 'Places',
  CreatedPlaces = 'CreatedPlaces',
  Event = 'Event',
  Notifications = 'Notifications',
  ExperienceSubscription = 'Subscription',
  Advanced = 'Advanced',
  AvatarCreationToken = 'AvatarCreationToken',
  ReferralRewards = 'ReferralRewards',
  Environment = 'Environment',
  Look = 'Look',
  Alert = 'Alert',
}

const itemValues = Object.values<string>(Item);
export const isItem = (value: string): value is Item => {
  return itemValues.includes(value);
};

export default Item;
