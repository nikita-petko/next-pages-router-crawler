import { OpenCloudError } from '@rbx/google-gax';

export const UnknownErrorMessageKey = 'Message.UnknownError';

// Please keep in sync with the service protos PublishingGatewayError.Error
// https://github.rbx.com/Roblox/service-contracts/blob/master/protos/roblox/avatarmarketplacepublishing/avatarmarketplacepublishinggateway/v1beta1/avatar_marketplace_publishing_gateway.proto
export enum AvatarMarketplacePublishingError {
  ERROR_INVALID = 'ERROR_INVALID',
  ERROR_MISSING_AUTHENTICATED_USER = 'ERROR_ERROR_MISSING_AUTHENTICATED_USER',
  ERROR_CREATOR_TYPE_INVALID = 'ERROR_CREATOR_TYPE_INVALID',
  ERROR_TARGET_TYPE_INVALID = 'ERROR_TARGET_TYPE_INVALID',
  ERROR_ITEM_NOT_FOUND = 'ERROR_ITEM_NOT_FOUND',
  ERROR_ITEM_MODERATION_UNKNOWN = 'ERROR_ITEM_MODERATION_UNKNOWN',
  ERROR_ITEM_MODERATED = 'ERROR_ITEM_MODERATED',
  ERROR_ITEM_TYPE_NOT_ALLOWED = 'ERROR_ITEM_TYPE_NOT_ALLOWED',
  ERROR_ITEM_NOT_OWNED = 'ERROR_ITEM_NOT_OWNED',
  ERROR_USER_MISSING_GROUP_PERMISSIONS = 'ERROR_USER_MISSING_GROUP_PERMISSIONS',
  ERROR_USER_MISSING_ID_VERIFICATION = 'ERROR_USER_MISSING_ID_VERIFICATION',
  ERROR_USER_CREATION_ACCESS_BLOCKED = 'ERROR_USER_CREATION_ACCESS_BLOCKED',
  ERROR_GROUP_OWNER_MISSING_PREMIUM = 'ERROR_GROUP_OWNER_MISSING_PREMIUM',
  ERROR_USER_MISSING_PREMIUM = 'ERROR_USER_MISSING_PREMIUM',
  ERROR_ITEM_TEXT_MODERATED = 'ERROR_ITEM_TEXT_MODERATED',
  ERROR_CREATOR_NOT_FOUND = 'ERROR_CREATOR_NOT_FOUND',
  ERROR_SALE_STATUS_INVALID = 'ERROR_SALE_STATUS_INVALID',
  ERROR_CURRENT_SALE_STATUS_INVALID = 'ERROR_CURRENT_SALE_STATUS_INVALID',
  ERROR_INVALID_SALE_STATUS_UPDATE = 'ERROR_INVALID_SALE_STATUS_UPDATE',
  ERROR_FAILED_TO_GET_BALANCE = 'ERROR_FAILED_TO_GET_BALANCE',
  ERROR_ITEM_ID_INVALID = 'ERROR_ITEM_ID_INVALID',
  ERROR_ITEM_TOO_NEW = 'ERROR_ITEM_TOO_NEW',
  ERROR_DELIST_ITEM_BLOCKED = 'ERROR_DELIST_ITEM_BLOCKED',
  ERROR_DELIST_ITEM_FAILED = 'ERROR_DELIST_ITEM_FAILED',
  ERROR_ITEM_INVALID = 'ERROR_ITEM_INVALID',
  ERROR_ITEM_NAME_MODERATED = 'ERROR_ITEM_NAME_MODERATED',
  ERROR_ITEM_DESCRIPTION_MODERATED = 'ERROR_ITEM_DESCRIPTION_MODERATED',
  ERROR_ITEM_NAME_AND_DESCRIPTION_MODERATED = 'ERROR_ITEM_NAME_AND_DESCRIPTION_MODERATED',
  ERROR_INSUFFICIENT_ROBUX = 'ERROR_INSUFFICIENT_ROBUX',
}

export const AMPGErrorLabelDictionary: { [errorCode: string]: string } = {
  [AvatarMarketplacePublishingError.ERROR_INVALID]: 'Label.InvalidError',
  [AvatarMarketplacePublishingError.ERROR_USER_MISSING_ID_VERIFICATION]:
    'Message.MissingIdVerification',
  [AvatarMarketplacePublishingError.ERROR_GROUP_OWNER_MISSING_PREMIUM]:
    'Message.GroupOwnerMissingPremiumSubscription',
  [AvatarMarketplacePublishingError.ERROR_USER_MISSING_PREMIUM]:
    'Message.MissingPremiumSubscription',
  [AvatarMarketplacePublishingError.ERROR_USER_CREATION_ACCESS_BLOCKED]:
    'Message.CreationAccessBlocked',
  [AvatarMarketplacePublishingError.ERROR_USER_MISSING_GROUP_PERMISSIONS]:
    'Message.MissingGroupPermission',
  [AvatarMarketplacePublishingError.ERROR_ITEM_NAME_MODERATED]: 'Message.NameModerated',
  [AvatarMarketplacePublishingError.ERROR_ITEM_DESCRIPTION_MODERATED]:
    'Message.DescriptionModerated',
  [AvatarMarketplacePublishingError.ERROR_ITEM_NAME_AND_DESCRIPTION_MODERATED]:
    'Message.NameAndDescriptionModerated',
  [AvatarMarketplacePublishingError.ERROR_INSUFFICIENT_ROBUX]: 'Message.InsufficientRobux',
  [AvatarMarketplacePublishingError.ERROR_ITEM_NOT_OWNED]: 'Message.AccessDenied',
};

export enum OCAvatarCreationTokenError {
  NotEnoughRobux = 1,
  FailedToListAvatarCreationTokens = 2,
  UserMissingGroupPermissionsToListAvatarCreationTokens = 3,
  AccessDeniedToListAvatarCreationTokens = 4,
}

export const ErrorLabelDictionary = {
  [OCAvatarCreationTokenError.NotEnoughRobux]: 'Label.InsufficientRobux',
};

function ParsedErrorToEnum(str: string): AvatarMarketplacePublishingError {
  const enumStr = `ERROR${str
    .replace(/([A-Z])/g, '_$1')
    .trim()
    .toUpperCase()}`;
  return AvatarMarketplacePublishingError[enumStr as keyof typeof AvatarMarketplacePublishingError];
}

export function parseError(errorCode: OpenCloudError): string {
  const { message } = errorCode;
  // find the error code in between brackets
  const matches = message.match(/\[(.*?)\]/);
  if (!matches) {
    return UnknownErrorMessageKey;
  }
  const foundError = matches[1];
  const ampgError = ParsedErrorToEnum(foundError);
  const msg = AMPGErrorLabelDictionary[ampgError];
  if (msg) {
    return msg;
  }

  return UnknownErrorMessageKey;
}
