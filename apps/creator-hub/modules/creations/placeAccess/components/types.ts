export enum PlaceAccessSocialSlotStrategy {
  RobloxOptimized = 'Automatic',
  Disabled = 'Empty',
  Customized = 'Custom',
}

export enum PlaceJoinRestrictionType {
  Default = 0,
  Open = 1,
  Legacy = 2,
  Secure = 3,
}

export type PlaceAccessFormType = {
  maxPlayerCount: number;
  socialSlotStrategy: PlaceAccessSocialSlotStrategy;
  customSocialSlotsCount: number;
  isSpecificJoinToNonRootPlacesAllowed: boolean;
  hasPlaceOverride: boolean;
  placeJoinRestrictionType: PlaceJoinRestrictionType;
};
