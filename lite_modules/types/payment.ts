import { AdCreditTransactionType } from '@constants/payment';

export interface PaymentProfileType {
  card_network: string;
  exp_month: number;
  exp_year: number;
  has_active_challenge: boolean;
  is_verified: boolean;
  last_four_digits: string;
  payment_profile_id: string;
}

export interface GetPaymentProfilesResponseType {
  data: PaymentProfileType[];
}

export interface GetAdCreditBalanceResponseType {
  ad_credit_balance_in_micro: number;
  is_account_activated: boolean;
  unbilled_balance_micro_usd: number;
}

export interface GetRobuxBalanceResponse {
  robux: number;
}

export interface AccountBalanceType {
  failed_payments_balance: number;
  running_balance: number;
}

export enum ChargeRequestStatusEnum {
  Succeeded = 3,
  Failed = 4,
}

export enum RefundRequestStatusEnum {
  PartiallySucceeded = 3,
  Succeeded = 4,
  Failed = 5,
}

export interface PaymentActivityType {
  charge_amount: number;
  charge_request_status?: ChargeRequestStatusEnum;
  charge_time_ms: number;
  currency_code: string;
  last_four_digits: string;
  refund_request_status?: RefundRequestStatusEnum;
  request_amount?: number;
  request_time_ms: number;
}

export interface ListPaymentActivitiesResponseType {
  activities: PaymentActivityType[];
  has_more: boolean;
}

export interface ListPaymentProfilesResponseType {
  data: PaymentProfileType[];
}

export interface AdCreditTransaction {
  actor_user_id?: string;
  ad_account_id: string;
  ad_credit_micros: number;
  campaign_id: string;
  campaign_name: string;
  created_timestamp_ms: number;
  id: string;
  organization_id: string;
  transaction_type: AdCreditTransactionType;
  updated_timestamp_ms: number;
}

export interface AdCreditTransactionHistoryResult {
  ad_credit_transaction_history: AdCreditTransaction[];
  next_cursor: string;
}

export interface CreatePaymentProfileSetupResponse {
  provider_payload: {
    client_secret: string;
  };
}

// BASED ON: https://apis.simulprod.com/ads-management-api/v1/docs/doc.json
export enum PURCHASE_RESPONSE_CODE_ENUM {
  AdCreditPurchaseStatus_AD_CREDIT_PURCHASE_STATUS_UNSPECIFIED = 0,
  AdCreditPurchaseStatus_AD_CREDIT_PURCHASE_STATUS_PURCHASE_FAILED = 1,
  AdCreditPurchaseStatus_AD_CREDIT_PURCHASE_STATUS_GRANT_PENDING = 2,
  AdCreditPurchaseStatus_AD_CREDIT_PURCHASE_STATUS_SUCCESS = 3,
}

export interface AutoReloadData {
  num_auto_reload_campaigns: number;
  total_daily_reload_amount: number;
}
