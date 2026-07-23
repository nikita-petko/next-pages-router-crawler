enum GameUpdateNotificationsErrorCodes {
  UnknownError = 0, // Unknown Error.
  InvalidUniverse = 1, // The universe does not exist.
  InvalidUniversePermissions = 3, // You are not authorized to configure this universe.
  UpdateTextBlocked = 7, // Your message was blocked by our filter. Please revise it and try again.
}

export default GameUpdateNotificationsErrorCodes;
