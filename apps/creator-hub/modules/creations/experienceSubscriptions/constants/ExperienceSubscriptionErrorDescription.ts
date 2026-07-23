import { ExperienceSubscriptionFailureReason } from '@modules/clients/experienceSubscriptions';

/**
 * Maps each `failureReason` enum value from the backend ErrorResponse to a
 * translation key in the `CreatorDashboard.DeveloperSubscriptions` namespace.
 *
 * When adding a new error type:
 * 1. Backend: add a new value to the `FailureReason` enum in developer-subscriptions-api
 * 2. Grasshopper: update the static OpenAPI schema and bump the client package version
 * 3. Here: add the mapping from the new enum value to an `Error.*` translation key
 * 4. Translations hub: register the key in `CreatorDashboard.DeveloperSubscriptions`
 *    (consumer: BaristaFrontend) with source English text and mark "Ready for Translation"
 *
 * Do NOT add raw English strings to the frontend. Every user-facing error must
 * go through this failureReason → translation key path so it can be localized.
 */
const experienceSubscriptionsFailureReasonToDescription: {
  [key in ExperienceSubscriptionFailureReason]?: string;
} = {
  [ExperienceSubscriptionFailureReason.Invalid]: 'Error.SubscriptionError',
  [ExperienceSubscriptionFailureReason.InvalidInput]: 'Error.SubscriptionError',
  [ExperienceSubscriptionFailureReason.InvalidProduct]: 'Error.SubscriptionError',
  [ExperienceSubscriptionFailureReason.ProductNotFound]: 'Error.NotFound',
  [ExperienceSubscriptionFailureReason.TooManyRequests]: 'Error.SubscriptionError',
  [ExperienceSubscriptionFailureReason.CreationLimitExceeded]: 'Error.CreationLimitExceeded',
  [ExperienceSubscriptionFailureReason.NotEligibleForDeveloperSubscriptions]: 'Error.Unauthorized',
  [ExperienceSubscriptionFailureReason.PendingProductUpdate]: 'Error.SubscriptionError',
  [ExperienceSubscriptionFailureReason.Unauthorized]: 'Error.Unauthorized',
  [ExperienceSubscriptionFailureReason.InternalError]: 'Error.SubscriptionError',
  [ExperienceSubscriptionFailureReason.ImageUploadError]: 'Error.UploadImageFailure',
  [ExperienceSubscriptionFailureReason.UniverseNotFound]: 'Error.SubscriptionError',
  [ExperienceSubscriptionFailureReason.ProductNameAlreadyTaken]:
    'Error.SubscriptionNameAlreadyUsed',
  [ExperienceSubscriptionFailureReason.CannotChangeAppStoreName]: 'Error.AppStoreNameTaken',
  [ExperienceSubscriptionFailureReason.ExperienceAppStoreNameAlreadyTaken]:
    'Error.AppStoreExperienceNameTaken',
  [ExperienceSubscriptionFailureReason.ProductContentModerated]:
    'Error.SubscriptionContentModerated',
  [ExperienceSubscriptionFailureReason.FiatPriceChangeNotSupported]:
    'Error.FiatPriceChangeNotSupported',
  [ExperienceSubscriptionFailureReason.PriceChangeCooldown]: 'Error.PriceChangeCooldown',
  [ExperienceSubscriptionFailureReason.FileTooLarge]: 'Error.FileTooLarge',
};

export default experienceSubscriptionsFailureReasonToDescription;
