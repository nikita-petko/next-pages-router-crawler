enum GameUpdateNotificationsErrorCodesV2 {
  InvalidUniversePermissions = 0, // Unknown Error.
  InvalidUniverse = 2, // The universe does not exist.
  UnknownError = 3, // You are not authorized to configure this universe.
  UpdateTextBlocked = 5, // Your message was blocked by our filter. Please revise it and try again.
}

export default GameUpdateNotificationsErrorCodesV2;
