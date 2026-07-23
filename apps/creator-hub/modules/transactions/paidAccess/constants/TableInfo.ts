import { RobloxPaidAccessFiatPaidAccessServiceV1PurchaseStatus as PurchaseStatus } from '@rbx/clients/fiatPaidAccessService';

export enum ColumnType {
  AssetDescription,
  Date,
  NetAmount,
  PriceSold,
  Purchaser,
  Status,
  TransactionType,
}

export const ColumnTypesToTranslationKey = new Map<ColumnType, string>([
  [ColumnType.AssetDescription, 'Label.Description'],
  [ColumnType.Date, 'Label.Date'],
  [ColumnType.NetAmount, 'Label.NetAmount'],
  [ColumnType.PriceSold, 'Label.PriceSold'],
  [ColumnType.Purchaser, 'Label.Source'],
  [ColumnType.Status, ''],
  [ColumnType.TransactionType, 'Label.TransactionType'],
]);

export const PaidAccessColumns = [
  ColumnType.Date,
  ColumnType.Purchaser,
  ColumnType.AssetDescription,
  ColumnType.TransactionType,
  ColumnType.PriceSold,
  ColumnType.Status,
  ColumnType.NetAmount,
];

export const PurchaseStatusMap = new Map<string, PurchaseStatus>([
  ['PURCHASE_STATUS_PURCHASE_SUCCESS', 'PurchaseSuccess'],
  ['PURCHASE_STATUS_REFUNDED', 'Refunded'],
  ['PURCHASE_STATUS_INVALID', 'Invalid'],
  ['PURCHASE_STATUS_PURCHASE_FAILURE', 'PurchaseFailure'],
]);
