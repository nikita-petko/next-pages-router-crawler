import { StoreTableType } from './StoreTableType';

export enum ColumnType {
  Amount,
  AssetDescription,
  Date,
  NetAmount,
  PriceSold,
  Purchaser,
  Seller,
  Source,
  Status,
  TransactionType,
}

export const ColumnTypesToTranslationKey = new Map<ColumnType, string>([
  [ColumnType.Amount, 'Label.Amount'],
  [ColumnType.AssetDescription, 'Label.Description'],
  [ColumnType.Date, 'Label.Date'],
  [ColumnType.NetAmount, 'Label.NetAmount'],
  [ColumnType.PriceSold, 'Label.PriceSold'],
  [ColumnType.Purchaser, 'Label.Source'],
  [ColumnType.Seller, 'Label.Source'],
  [ColumnType.Status, ''],
  [ColumnType.TransactionType, 'Label.TransactionType'],
  [ColumnType.Source, 'Label.Source'],
]);

export const IncomingPaymentColumns = [
  ColumnType.Date,
  ColumnType.Purchaser,
  ColumnType.AssetDescription,
  ColumnType.TransactionType,
  ColumnType.PriceSold,
  ColumnType.Status,
  ColumnType.NetAmount,
];

export const OutgoingPaymentColumns = [
  ColumnType.Date,
  ColumnType.Seller,
  ColumnType.AssetDescription,
  ColumnType.TransactionType,
  ColumnType.Status,
  ColumnType.Amount,
];

export const PayoutColumns = [ColumnType.Date, ColumnType.Source, ColumnType.Amount];

export const ColumnsMap = new Map<StoreTableType, ColumnType[]>([
  [StoreTableType.IncomingPayments, IncomingPaymentColumns],
  [StoreTableType.OutgoingPayments, OutgoingPaymentColumns],
  [StoreTableType.Payouts, PayoutColumns],
]);
