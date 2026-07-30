/** Shared reasons shown in both user- and group-account surveys. */
export const ASSET_PRIVACY_OPT_OUT_SHARED_REASON_IDS = [
  'offlineWorkflowsNotSupported',
  'tooManyPermissionErrorsOnInsert',
  'wantUniversalAccessWithoutCreatorStore',
] as const;

/** Friction reasons for user-account survey (e.g. Creator Settings). */
export const ASSET_PRIVACY_OPT_OUT_USER_ACCOUNT_FRICTION_REASON_IDS = [
  'userSharingWithFriendsTooMuchFriction',
  'userSharingWithGroupsTooMuchFriction',
] as const;

/** Friction reasons for group-account survey. */
export const ASSET_PRIVACY_OPT_OUT_GROUP_ACCOUNT_FRICTION_REASON_IDS = [
  'groupSharingWithFriendsTooMuchFriction',
  'groupSharingWithGroupsTooMuchFriction',
] as const;

/** Checkbox order for user-level opt-out survey. */
export const ASSET_PRIVACY_OPT_OUT_SURVEY_REASON_IDS_USER = [
  ...ASSET_PRIVACY_OPT_OUT_USER_ACCOUNT_FRICTION_REASON_IDS,
  ...ASSET_PRIVACY_OPT_OUT_SHARED_REASON_IDS,
] as const;

/** Checkbox order for group-level opt-out survey. */
export const ASSET_PRIVACY_OPT_OUT_SURVEY_REASON_IDS_GROUP = [
  ...ASSET_PRIVACY_OPT_OUT_GROUP_ACCOUNT_FRICTION_REASON_IDS,
  ...ASSET_PRIVACY_OPT_OUT_SHARED_REASON_IDS,
] as const;

/** All reason ids (union for payloads and analytics). */
export const ASSET_PRIVACY_OPT_OUT_REASON_IDS = [
  ...ASSET_PRIVACY_OPT_OUT_USER_ACCOUNT_FRICTION_REASON_IDS,
  ...ASSET_PRIVACY_OPT_OUT_GROUP_ACCOUNT_FRICTION_REASON_IDS,
  ...ASSET_PRIVACY_OPT_OUT_SHARED_REASON_IDS,
] as const;

export type AssetPrivacyOptOutReasonId = (typeof ASSET_PRIVACY_OPT_OUT_REASON_IDS)[number];

export type AssetPrivacyOptOutSurveyPayload = {
  reasonIds: AssetPrivacyOptOutReasonId[];
  additionalFeedback: string;
};

/** Maps each reason id to its CreatorDashboard.AssetPrivacy translation key. */
export const ASSET_PRIVACY_OPT_OUT_REASON_TRANSLATION_KEYS: Record<
  AssetPrivacyOptOutReasonId,
  string
> = {
  userSharingWithFriendsTooMuchFriction: 'Action.ReasonUserSharingWithFriendsTooMuchFriction',
  groupSharingWithFriendsTooMuchFriction: 'Action.ReasonGroupSharingWithFriendsTooMuchFriction',
  userSharingWithGroupsTooMuchFriction: 'Action.ReasonUserSharingWithGroupsTooMuchFriction',
  groupSharingWithGroupsTooMuchFriction: 'Action.ReasonGroupSharingWithGroupsTooMuchFriction',
  offlineWorkflowsNotSupported: 'Action.ReasonOfflineWorkflowsNotSupported',
  tooManyPermissionErrorsOnInsert: 'Action.ReasonTooManyPermissionErrorsOnInsert',
  wantUniversalAccessWithoutCreatorStore: 'Action.ReasonWantUniversalAccessWithoutCreatorStore',
};
