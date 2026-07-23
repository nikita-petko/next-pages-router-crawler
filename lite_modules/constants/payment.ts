import { InvalidServerPaymentType, ServerPaymentType } from '@constants/campaign';

export const PaymentUnit = {
  [InvalidServerPaymentType.PAYMENT_TYPE_UNSPECIFIED]: 'Ad Credit',
  [ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT]: 'Ad Credit',
  [ServerPaymentType.PAYMENT_TYPE_CARD]: 'USD',
  [ServerPaymentType.PAYMENT_TYPE_GROUP_AD_CREDIT]: 'Ad Credit',
  [ServerPaymentType.PAYMENT_TYPE_INVOICE]: 'USD',
};

// https://github.rbx.com/Roblox/ads/blob/aa9ad5480df9c0ff461a945a796d04c8f8c8db36/protos/roblox/ads/shared/enums/v3/ad_entity_enums.proto#L419
export enum AdCreditTransactionType {
  AD_CREDIT_TRANSACTION_TYPE_UNSPECIFIED = 0,
  AD_CREDIT_TRANSACTION_TYPE_DEBIT = 1,
  AD_CREDIT_TRANSACTION_TYPE_DEPOSIT = 2,
  AD_CREDIT_TRANSACTION_TYPE_REFUND = 3,
  AD_CREDIT_TRANSACTION_TYPE_ADJUSTMENT = 4,
  AD_CREDIT_TRANSACTION_TYPE_PROMOTION = 5,
  AD_CREDIT_TRANSACTION_TYPE_AUTO_DEPOSIT = 6,

  // AD_CREDIT_TRANSACTION_TYPE_PENDING_UNBILLED used for Pending transaction on client-side only (unbilled_balance_micro_usd)
  AD_CREDIT_TRANSACTION_TYPE_PENDING_UNBILLED = 101,
}
