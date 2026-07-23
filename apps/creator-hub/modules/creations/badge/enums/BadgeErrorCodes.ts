enum BadgesErrorCodes {
  UnknownError = 0, // An error that reserves the zero error code the base level. Do not use.
  InvalidBadge = 1, // The badge is invalid or does not exist.
  InvalidBadgePermissions = 2, // The user does not have permission to manage the badge.
  InvalidUniverse = 3, // The universe is invalid or does not exist.
  InvalidUser = 4, // The user is invalid or does not exist.
  TooManyBadgeIds = 5, // Too many badge Ids.
  TextModerated = 6, // Text filter moderated string in request.
  InvalidPlace = 7, // Place is invalid or does not exist.
  InvalidPermissionsToAwardBadge = 8, // The place doesn't have permission to award the badge.
  FailedToAwardBadge = 9, // Failed to award badge.
  InvalidUserPermissions = 10, // Current user does not have permission to manage user's badge.
  InvalidBadgeIcon = 11, // The badge icon is invalid.
  InvalidUniversePermissions = 12, // Authentication user does not have permission to manage badges for the game.
  TooManyRequests = 13, // Too many requests, try again later.
  InvalidName = 14, // Badge name is invalid.
  InvalidDescription = 15, // Badge description is invalid.
  InvalidPaymentSource = 16, // Payment source is invalid.
  InsufficientFunds = 17, // Insufficient funds.
  InvalidExpectedCost = 18, // Expected badge cost is different from the actual badge cost.
  InvalidOrderingBin = 19, // An ordering bin is invalid.
  InvalidUniverseForBadgesReordering = 20, // The universe is not authorized to perform the reordering operation.
  OperationUnavailable = 21, // The operation is unavailable.
  IconFileMissing = 22, // The icon file is missing.
  RankUpdateConflict = 23, // Two or more requests that update badge ranks occurred at the same time.
}

export default BadgesErrorCodes;
