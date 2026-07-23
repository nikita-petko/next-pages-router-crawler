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

/**
 * Which field the user last edited in the watermarked Robux -> Ad Credit
 * conversion dual input, so the server knows which value is the source of truth.
 * `ad_credit_amount` was previously named `ad_credit_usd`; see the backend
 * rename plan (the value is a whole ad credit unit, not a raw USD money amount).
 */
type AdCreditQuoteSourceField = 'ad_credit_amount' | 'robux_amount';

type AdCreditQuoteTierType = 'O18' | 'STANDARD';

export interface AdCreditPurchaseQuoteRequest {
  /** Whole ad credit units; sent when source_field is `ad_credit_amount`. */
  ad_credit_amount?: number;
  /** Group scope for the conversion; omitted for personal purchases. */
  groupId?: number;
  /** Robux the user typed; sent when source_field is `robux_amount`. */
  robux_amount?: number;
  source_field: AdCreditQuoteSourceField;
}

interface AdCreditPurchaseQuoteTier {
  /** Ad credit granted for this tier, in micro-USD. */
  ad_credit_micros: number;
  /** Effective Ad-Credit-per-Robux (USD) conversion rate applied at this tier. */
  ad_credit_per_robux: number;
  /** Robux allocated to this tier. */
  robux_amount: number;
  tier: AdCreditQuoteTierType;
}

export interface AdCreditPurchaseQuoteResponse {
  /** Cent-ceiled total ad credit granted, in micro-USD. */
  ad_credit_quantity_micros: number;
  /** Effective 18+ (O18) Robux balance the server allocated from first. */
  effective_o18_robux: number;
  /** Effective standard Robux balance used after the O18 balance is exhausted. */
  effective_standard_robux: number;
  /**
   * Shared AMA error code (see `@constants/errorCodes`) explaining why the quote
   * is invalid. Omitted/empty for valid quotes.
   */
  error_code?: string;
  /**
   * Whether the requested amount is purchasable given balances and min/max
   * bounds. When false the UI blocks the purchase and surfaces an error.
   */
  is_valid: boolean;
  /** Minimized total Robux the purchase will actually debit. */
  robux_charge: number;
  source_field: AdCreditQuoteSourceField;
  tier_breakdown: AdCreditPurchaseQuoteTier[];
}

export interface ConvertRobuxToAdCreditRequest {
  /** Cent-ceiled ad credit total from the confirmed quote, in micro-USD. */
  ad_credit_quantity_micros: number;
  groupId?: number;
  /** Minimized Robux charge from the confirmed quote. */
  robux_amount: number;
}

export interface ConvertRobuxToAdCreditResponse {
  purchase_status: PURCHASE_RESPONSE_CODE_ENUM;
}
