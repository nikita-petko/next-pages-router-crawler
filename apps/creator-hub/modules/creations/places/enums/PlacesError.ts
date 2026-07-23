export enum PlacesError {
  InvalidPlaceId = 1, // The place does not exist.
  UnauthorizedPlaceAccess = 2, // You are not authorized to configure this place.
  LongDescription = 3, // The description is too long.
  NullConfiguration = 4, // Configuration argument is missing
  UnauthorizedPrivateServerAccess = 5, // You are not authorized to change the private server settings for this place.
  InvalidPrivateServerPrice = 6, // The provided price for private servers is not valid.
  MarketplaceServiceUnavailable = 7, // Marketplace service was unavailable.
  UnknownErrorUpdatingPrivateServerSettings = 8, // An unknown error occurred while updating private server settings.
  UnknownGameInstanceConstraintsError = 9, // An unknown error occurred while updating or getting game instance constraints.
  UnknownAssetSettingsError = 10, // An unknown error occurred while updating or getting asset settings.
  InvalidArgumentUpdatingUniverseNameAndDescription = 11, // An argument error occurred while updating universe name and description.
  UnknownAssetVersionError = 12, // An unknown error occurred while getting the place version number.
  InvalidAllowedGearTypeError = 13, // Invalid Allowed Gear Type
  ModerationErrorUpdatingUniverseNameAndDescription = 15, // New universe name or description has been rejected due to moderation.
  IneligibleToCopyUnlockError = 16, // You are ineligible to unlock this place for copying.
}

export default PlacesError;
