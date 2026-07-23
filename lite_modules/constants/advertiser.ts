export const enum AdAccountPaymentFailureReasonEnum {
  UNSPECIFIED = 0,
  PROFILE_NOT_VERIFIED = 1,
  TRANSACTION_FAILURE = 2,
  TRANSACTION_FAILURE_AND_PROFILE_NOT_VERIFIED = 3,
  PAYMENT_SERVICE_UNAVAILABLE = 4,
}

// Corresponds to https://github.rbx.com/Roblox/ads/blob/master/protos/roblox/ads/shared/advertiser/v1/ad_account.proto
export const enum AdAccountPaymentStatusEnum {
  UNSPECIFIED = 0,
  SUCCEEDED = 1,
  FAILED = 2,
  UNKNOWN = 3,
}

export enum AdAccountTypeFromModel {
  Business = 1,
  Personal = 2,
}
