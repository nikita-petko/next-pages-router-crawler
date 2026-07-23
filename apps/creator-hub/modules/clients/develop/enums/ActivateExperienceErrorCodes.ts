enum ActivateExperienceErrorCodes {
  UnknownError = 0, // Unknown Error.
  InvalidUniverse = 1, // The universe does not exist.
  NoRootPlace = 2, // This universe does not have a root place.
  InvalidUniversePermissions = 3, // You are not authorized to configure this universe.
  InvalidRootPlace = 6, // The root place for this universe is under review and can not be activated.
  MaxPlacesReached = 7, // New universe name is too long.
  CreatorAccountTooYoung = 16, // Creator account is too young to activate this universe.
}

export default ActivateExperienceErrorCodes;
