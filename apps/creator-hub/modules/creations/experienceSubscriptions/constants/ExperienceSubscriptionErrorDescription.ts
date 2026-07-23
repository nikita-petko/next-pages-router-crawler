import { ExperienceSubscriptionFailureReason } from '@modules/clients/experienceSubscriptions';

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
};

export default experienceSubscriptionsFailureReasonToDescription;
