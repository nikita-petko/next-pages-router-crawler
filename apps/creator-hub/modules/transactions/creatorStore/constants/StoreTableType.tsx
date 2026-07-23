export enum StoreTableType {
  IncomingPayments = 'IncomingPayments',
  OutgoingPayments = 'OutgoingPayments',
  Payouts = 'Payouts',
}

export const StoreTableTypeToTranslationKey = new Map<StoreTableType, string>([
  [StoreTableType.IncomingPayments, 'Label.IncomingPayments'],
  [StoreTableType.OutgoingPayments, 'Label.OutgoingPayments'],
  [StoreTableType.Payouts, 'Label.Payouts'],
]);
