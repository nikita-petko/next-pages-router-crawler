import { ResponseError } from '@modules/clients/utils';

const getTranslationKeyForItemConfigurationError = (
  error: ResponseError | null,
  defaultKey?: string | undefined,
): string => {
  switch (error?.code) {
    case 9:
      return 'Message.LimitedPublishLimit';
    case 12:
      return 'Message.MissingGroupPermission';
    case 14:
      return 'Message.ItemPendingReview';
    case 15:
      return 'Message.ItemIsModeratedOrPendingReview';
    case 18:
      return 'Message.UserDoesNotOwnItem';
    case 19:
      return 'Message.ItemPriceTooLow';
    case 20:
      return 'Message.ItemPriceTooHigh';
    case 21:
      return 'Message.AssetIdInvalid';
    case 26:
      return 'Message.NameOrDescriptionModerated';
    case 28:
      return 'Message.L2PreviouslyOnSale';
    case 35:
      return 'Message.QuantityInvalid';
    case 44:
      return 'Message.InvalidQuantityLimit';
    case 45:
      return 'Message.AssetCopyOfPublished';
    case 52:
      return 'Message.ItemIsModeratedOrPendingReview';
    case 59:
      return 'Message.PriceOffsetInvalid';
    case 60:
      return 'Message.MinimumPriceInvalid';
    case 61:
      return 'Message.InvalidSaleStatus';
    case 70:
      return 'Message.NotEnoughRobux';
    case 72:
      return 'Message.ItemIsModeratedOrPendingReview';
    case 75:
      return 'Message.ItemHasArchivedDependencies';
    case 76:
      return 'Message.ItemIsDelisted';
    case 79:
      return 'Message.InvalidSaleLocation';
    case 101:
      // Value 101 is shared across multiple error enums used in Roblox.ItemConfiguration.Api
      return 'Message.CalendarQuotaLimit';
    case 106:
      return 'Message.MissingIdVerification';
    case 107:
      return 'Message.CreationAccessBlocked';
    case 108:
      return 'Message.MissingPremiumSubscription';
    case 109:
      return 'Message.GroupOwnerMissingPremiumSubscription';
    case 118:
      return 'Message.GrantedItemCannotBePublished';
    default:
      return defaultKey ?? 'Message.UnknownError';
  }
};

export default getTranslationKeyForItemConfigurationError;
