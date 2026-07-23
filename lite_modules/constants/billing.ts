import { AdCreditTransactionType } from '@constants/payment';
import { AdCreditTransaction } from '@type/payment';

// API Keys for getting stripePromise for rendering Stripe iframe
export const STRIPE_DEV_PUBLIC_KEY =
  'pk_test_51LNOeQHDRNiW7vlLcKH8TGCpJ7zhaidLdSegE22GCuvQbVUX2xDiGJY6WYaldYyo6qgVxmy1SnSVpSdaqyjfqclU00NQwWntIe';
export const STRIPE_STAGING_PUBLIC_KEY =
  'pk_test_51LNM0XG5RADBkfjhYJlpADA2ArzWIh7gTWTodYNbpEzSiT55dul3VJhaBIVHL0CNyO0gECOz1vPnWArAkjwQ8NBO00Cdf2PxED';
export const STRIPE_PROD_PUBLIC_KEY =
  'pk_live_51LKpO9C8tJWGhK4HEHtny9Dg7xXiQJ1i349cq6KBDusbl8bRHO7QmCKKhX18LPjSirMNTvj3tesq6mhIQuPioeAd0062ZCgoF3';

export const STRIPE_PAYMENT_PROVIDER = 5;

export enum CardVerificationResultEnum {
  CARD_AUTHENTICATION_FAILED = 'CARD_AUTHENTICATION_FAILED',
  CARD_REMOVED = 'CARD_REMOVED',
  SOMETHING_WENT_WRONG = 'SOMETHING_WENT_WRONG',
  SUCCESS = 'SUCCESS',
  SUCCESS_AND_FIRST_PAYMENT_METHOD = 'SUCCESS_AND_FIRST_PAYMENT_METHOD',
  UNKNOWN_STRIPE_ERROR = 'UNKNOWN_STRIPE_ERROR',
}

export enum PaymentActivityTabType {
  CARD_PAYMENT_ACTIVITY_TAB = 0,
  AD_CREDIT_PAYMENT_ACTIVITY_TAB = 1,
  GROUP_AD_CREDIT_PAYMENT_ACTIVITY_TAB = 2,
}

const ASSET_BASE_PATH = `${process.env.assetPathPrefix}/common`;
export const adCreditSpritePath = `${ASSET_BASE_PATH}/roblox_icon_white.svg`;

export const MICRO_USD_IN_USD = 1000000;
export const DEFAULT_PAYMENT_THRESHOLD_MICRO_USD = 100000000;

export enum ADD_PAYMENT_TABS {
  ADS_CREDIT = 'AdsCredit',
  CREDIT_CARD = 'CreditCard',
}

export enum PaymentMethodActionEnum {
  ADD = 'AddPaymentMethod',
  RELOAD_AD_CREDIT = 'ReloadAdCredit',
  UPDATE_CARD = 'UpdateCard',
}

export enum AdCreditBalanceScope {
  Group = 'group',
  Personal = 'personal',
}

export const parseAdCreditBalanceScopeFromQuery = (
  value: string | string[] | undefined,
): AdCreditBalanceScope | undefined => {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (normalized === AdCreditBalanceScope.Group) {
    return AdCreditBalanceScope.Group;
  }
  if (normalized === AdCreditBalanceScope.Personal) {
    return AdCreditBalanceScope.Personal;
  }
  return undefined;
};

export const parsePaymentActivityTab = (
  tab?: string | string[],
): PaymentActivityTabType | undefined => {
  const tabValue = Array.isArray(tab) ? tab[0] : tab;
  const parsedTab = Number(tabValue);

  if (
    parsedTab === PaymentActivityTabType.CARD_PAYMENT_ACTIVITY_TAB ||
    parsedTab === PaymentActivityTabType.AD_CREDIT_PAYMENT_ACTIVITY_TAB ||
    parsedTab === PaymentActivityTabType.GROUP_AD_CREDIT_PAYMENT_ACTIVITY_TAB
  ) {
    return parsedTab;
  }

  return undefined;
};

export enum PaymentMethodType {
  AmericanExpress = 'amex',
  Discover = 'discover',
  MasterCard = 'mastercard',
  Visa = 'visa',
}

export const PendingAdCreditTransaction: AdCreditTransaction = {
  ad_account_id: '',
  ad_credit_micros: 0,
  campaign_id: '',
  campaign_name: '',
  created_timestamp_ms: 0,
  id: 'PendingAdCreditTransaction',
  organization_id: '',
  transaction_type: AdCreditTransactionType.AD_CREDIT_TRANSACTION_TYPE_PENDING_UNBILLED,
  updated_timestamp_ms: 0,
};
