// Ref: https://github.rbx.com/Roblox/web-frontend/blob/master/WebApps/Roblox.Groups.WebApp/Roblox.Groups.WebApp/js/angular/groups/constants/groupsConstants.js
enum GroupErrorCodes {
  UnknownError = 0,
  InvalidGroup = 1,
  InvalidMembership = 10,
  TooManyGroups = 11,
  InsufficientRobux = 12,
  NameInvalid = 13,
  NameModerated = 14,
  GroupIconInvalid = 15,
  GroupIconMissing = 16,
  TooManyRequests = 17,
  DescriptionTooLong = 18,
  NameTooLong = 19,
  DuplicateName = 20,
  FeatureDisabled = 21,
  GroupIconTooLarge = 22,
  TwoStepVerificationRequired = 35,
  VerifiedEmailRequired = 38,
}

export default GroupErrorCodes;
