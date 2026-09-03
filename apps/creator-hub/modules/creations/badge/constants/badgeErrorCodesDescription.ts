import BadgesErrorCodes from '../enums/BadgeErrorCodes';

const badgeErrorCodeToDescription: { [key in BadgesErrorCodes]: string } = {
  [BadgesErrorCodes.UnknownError]: 'Error.Submit',
  [BadgesErrorCodes.InvalidBadge]: 'Error.InvalidBadge',
  [BadgesErrorCodes.InvalidBadgePermissions]: 'Error.InvalidBadgePermissions',
  [BadgesErrorCodes.InvalidUniverse]: 'Error.InvalidUniverse',
  [BadgesErrorCodes.InvalidUser]: 'Error.InvalidUser',
  [BadgesErrorCodes.TooManyBadgeIds]: 'Error.TooManyBadgeIds',
  [BadgesErrorCodes.TextModerated]: 'Error.TextModerated',
  [BadgesErrorCodes.InvalidPlace]: 'Error.InvalidPlace',
  [BadgesErrorCodes.InvalidPermissionsToAwardBadge]: 'Error.InvalidPermissionsToAwardBadge',
  [BadgesErrorCodes.FailedToAwardBadge]: 'Error.FailedToAwardBadge',
  [BadgesErrorCodes.InvalidUserPermissions]: 'Error.InvalidUserPermissions',
  [BadgesErrorCodes.InvalidBadgeIcon]: 'Error.InvalidBadgeIcon',
  [BadgesErrorCodes.InvalidUniversePermissions]: 'Error.InvalidUniversePermissions',
  [BadgesErrorCodes.TooManyRequests]: 'Error.TooManyRequests',
  [BadgesErrorCodes.InvalidName]: 'Error.InvalidName',
  [BadgesErrorCodes.InvalidDescription]: 'Error.InvalidDescription',
  [BadgesErrorCodes.InvalidPaymentSource]: 'Error.InvalidPaymentSource',
  [BadgesErrorCodes.InsufficientFunds]: 'Error.InsufficientFunds',
  [BadgesErrorCodes.InvalidExpectedCost]: 'Error.InvalidExpectedCost',
  [BadgesErrorCodes.InvalidOrderingBin]: 'Error.InvalidOrderingBin',
  [BadgesErrorCodes.InvalidUniverseForBadgesReordering]: 'Error.InvalidUniverseForBadgesReordering',
  [BadgesErrorCodes.OperationUnavailable]: 'Error.OperationUnavailable',
  [BadgesErrorCodes.IconFileMissing]: 'Error.IconFileMissing',
  [BadgesErrorCodes.RankUpdateConflict]: 'Error.RankUpdateConflict',
};

export default badgeErrorCodeToDescription;
