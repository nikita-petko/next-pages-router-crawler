import {
  ApplicationErrorResponseCode,
  EApplicationErrorResponseFields,
} from '@modules/clients/applicationAuthorization';

export type TCommonApplicationErrorResponseCode =
  | typeof ApplicationErrorResponseCode.ApplicationNameTaken
  | typeof ApplicationErrorResponseCode.InvalidArgument
  | typeof ApplicationErrorResponseCode.MalformedRedirectUri
  | typeof ApplicationErrorResponseCode.TextInappropriate
  | typeof ApplicationErrorResponseCode.TargetUnauthorizedAccess
  | typeof ApplicationErrorResponseCode.ActiveApplicationLimitExceeded
  | typeof ApplicationErrorResponseCode.InvalidImageFile
  | typeof ApplicationErrorResponseCode.PublishLimitExceeded;

export type TErrorFieldTranslation = { [key in EApplicationErrorResponseFields]?: string } | string;
export type TErrorCodeTranslationMap = {
  [key in TCommonApplicationErrorResponseCode]: TErrorFieldTranslation;
};

const errorCodeTranslationKeys: TErrorCodeTranslationMap = {
  [ApplicationErrorResponseCode.InvalidArgument]: {
    [EApplicationErrorResponseFields.TermsOfServiceUri]: 'Response.InvalidTermsOfServiceUri',
    [EApplicationErrorResponseFields.PrivacyPolicyUri]: 'Response.InvalidPrivacyPolicyUri',
    [EApplicationErrorResponseFields.Summary]: 'Response.InvalidSummary',
    [EApplicationErrorResponseFields.Name]: 'Response.InvalidName',
  },
  [ApplicationErrorResponseCode.TextInappropriate]: {
    [EApplicationErrorResponseFields.Summary]: 'Response.InappropriateSummary',
    [EApplicationErrorResponseFields.Name]: 'Response.InappropriateAppName',
  },
  [ApplicationErrorResponseCode.ApplicationNameTaken]: 'Response.DuplicateAppName',
  [ApplicationErrorResponseCode.MalformedRedirectUri]: 'Response.MalformedRedirectUri',
  [ApplicationErrorResponseCode.TargetUnauthorizedAccess]: 'Response.OAuthUnauthorizedAccess',
  [ApplicationErrorResponseCode.ActiveApplicationLimitExceeded]: 'Response.OAuthMaxNumberApps',
  [ApplicationErrorResponseCode.InvalidImageFile]: 'Response.InvalidImageFile2',
  [ApplicationErrorResponseCode.PublishLimitExceeded]: 'Response.PublishLimitExceeded',
};

export default errorCodeTranslationKeys;
