enum ConfigureUniverseErrorCodes {
  UnknownError = 0, // Unknown Error.
  InvalidUniverse = 1, // The universe does not exist.
  InvalidUniversePermissions = 2, // You are not authorized to configure this universe.
  NameOrDescriptionRejected = 7, // New universe name or description has been rejected.
  NameTooLong = 8, // New universe name is too long.
  NoRootPlace = 12, // This universe does not have a root place.
  MissingLuobuTerms = 29, // Luobu app terms of service user agreement is missing.
  CreatorAccountTooYoung = 40, // Creator account is too young to activate this universe.
}

export default ConfigureUniverseErrorCodes;
