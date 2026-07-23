// Based on AMA CampaignStatus type: https://sourcegraph.rbx.com/search?q=context:global+repo:%5Egithub%5C.rbx%5C.com/Roblox/ads%24+CampaignStatus&patternType=keyword&sm=0
export enum ServerCampaignStatusType {
  ENABLED = 2,
  STOPPED = 3,
  ARCHIVED = 4,
  CANCELLED = 5,
  PAUSED_INSUFFICIENT_AD_CREDIT = 6,
}

// Based on AMA CampaignObjective type: https://sourcegraph.rbx.com/search?q=context:global+repo:%5Egithub%5C.rbx%5C.com/Roblox/ads%24+CampaignObjective&patternType=keyword&sm=0
export enum ServerCampaignObjectiveType {
  AWARENESS = 1,
  VISITS = 2,
  VIDEO_VIEWS = 3,
  RETENTION = 4,
  REACTIVATION = 5,
  NEW_USERS = 6,
  REACH = 7,
  SPEND = 8,
  ENGAGED_PLAYS = 9,
}

// Based on AMA PaymentType type: https://sourcegraph.rbx.com/search?q=context:global+repo:%5Egithub%5C.rbx%5C.com/Roblox/ads%24+PaymentType&patternType=keyword&sm=0
export enum ServerPaymentType {
  PAYMENT_TYPE_UNSPECIFIED = 0,
  PAYMENT_TYPE_CARD = 1,
  PAYMENT_TYPE_ADS_CREDIT = 2,
  PAYMENT_TYPE_INVOICE = 3,
  PAYMENT_TYPE_GROUP_AD_CREDIT = 4,
}

export const isAdCreditPaymentType = (paymentType: ServerPaymentType): boolean =>
  paymentType === ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT ||
  paymentType === ServerPaymentType.PAYMENT_TYPE_GROUP_AD_CREDIT;

export enum InvalidServerPaymentType {
  PAYMENT_TYPE_UNSPECIFIED = 0,
}
export type AllServerPaymentType = ServerPaymentType | InvalidServerPaymentType;

export enum ServerBudgetType {
  BUDGET_TYPE_UNDEFINED_INVALID = 0,
  BUDGET_TYPE_DAILY = 1,
  BUDGET_TYPE_LIFETIME = 2,
}

export enum ServerDetailedTargetingMatchType {
  // UNSPECIFIED value is for All players
  DETAILED_TARGETING_MATCH_TYPE_UNSPECIFIED = 0,
  DETAILED_TARGETING_MATCH_TYPE_REACTIVATION = 1,
  DETAILED_TARGETING_MATCH_TYPE_RETENTION = 2,
  DETAILED_TARGETING_MATCH_TYPE_ACQUIRE_NEW_USERS = 3,
}

export const DefaultServerCampaignObjectiveType: ServerCampaignObjectiveType =
  ServerCampaignObjectiveType.VISITS;

export const DefaultServerDetailedTargetingMatchType: ServerDetailedTargetingMatchType =
  ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_UNSPECIFIED;

// Minimum milliseconds before midnight required to schedule a budget decrease for that midnight.
// If less time remains, the decrease is scheduled for the following midnight instead.
// Must match ScheduledBudgetBufferMs in ads-management-api/internal/util/update_campaign_validator.go.
export const SCHEDULED_BUDGET_DECREASE_BUFFER_MS = 5 * 60 * 1000;

// Fallback buffer applied to projected spend when validating lifetime budget decreases.
// Used when the metadata endpoint value is unavailable. The authoritative value is
// served via lifetimeBudgetDecreaseBufferRatio in the metadata response.
export const DEFAULT_LIFETIME_BUDGET_DECREASE_BUFFER_RATIO = 1.1;
