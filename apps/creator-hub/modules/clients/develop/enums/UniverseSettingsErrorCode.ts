enum UniverseSettingsErrorCode {
  InvalidUniverseId = 1, // The universe does not exist.

  UnauthorizedUniverseAccess = 2, // You are not authorized to configure this universe.

  InvalidAvatarType = 3, // Invalid UniverseAvatarType.

  InvalidScaleType = 4, // Invalid UniverseScaleType.

  InvalidAnimationType = 5, // Invalid UniverseAnimationType.

  InvalidCollisionType = 6, // Invalid UniverseCollisionType.

  RejectedUniverseNameOrDescription = 7, // New universe name or description has been rejected.

  UniverseNameTooLong = 8, // New universe name is too long.

  FailedShutdown = 9, // Failed to shutdown all intances of game after changing AvatarType. The change has been reverted.

  InvalidBodyType = 10, // Invalid UniverseBodyType.

  InvalidJointPositioningType = 11, // Invalid UniverseJointPositioningType.

  UniverseHasNoRootPlace = 12, // The universe has no root place.

  AtLeastOnePlayableDeviceRequired = 13, // At least one playable device must be provided.

  UserCannotSellGames = 14, // You are not authorized to sell games.

  PriceIsRequired = 15, // Price is required when isForSale is true.

  CannotSellFriendsOnlyGames = 16, // This game cannot be offered for sale because it is not public.

  CannotSellGameWithPrivateServers = 17, // This game cannot be offered for sale because it has private servers enabled.

  PriceOutOfRange = 18, // The game price is outside of the allowed range.

  InvalidGenre = 19, // Invalid genre.

  RequestBodyMissing = 20, // The request body is missing.

  InvalidDeviceType = 21, // Invalid device type.

  InvalidAssetTypeValues = 22, // Invalid asset type.

  InvalidMinAndMax = 23, // Invalid value, the min must be less than or equal to the max.

  InvalidScaleValue = 24, // Invalid scale value

  UnauthorizedPrivateServerAccess = 25, // Not authorized to update private server settings

  InvalidPrivateServerPrice = 26, // Invalid private server price

  UnknownErrorUpdatingPrivateServerSettings = 27, // Unknown error while updating private server settings

  InvalidOptInOutRegion = 28, // OptIn/Out Regions Not Supported.

  LuobuAppTermsOfServiceUserAgreementMissing = 29, // Luobu app terms of service user agreement is missing.

  UnknownErrorUpdatingOptInOutRegion = 30, // Unknown error while updating Opt in out region.

  PaidAccessReactivationCooldown = 39, // Paid access was recently edited. Please wait before reactivating.

  PriceChangeTooSoon = 41, // Private server price can only be changed once every N days
}

export default UniverseSettingsErrorCode;
