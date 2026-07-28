export enum VirtualColumnType {
  Date = 'Date',
  TransactionType = 'TransactionType',
  Source = 'Source',
  Status = 'Status',
  Amount = 'Amount',
}

// currencyHolder is implicit (it is always the virtual being viewed), so the
// table surfaces the counterParty as the "Source" column instead.
// Column order follows the Figma design: Date, Source, Type, Status, Amount.
export const VirtualColumns: VirtualColumnType[] = [
  VirtualColumnType.Date,
  VirtualColumnType.Source,
  VirtualColumnType.TransactionType,
  VirtualColumnType.Status,
  VirtualColumnType.Amount,
];

// The three settlement states surfaced in the Status column, mirroring the exported V2 sales
// report so the on-screen value matches the CSV a creator downloads.
export enum VirtualTransactionStatus {
  Pending = 'pending',
  Paid = 'paid',
  Refunded = 'refunded',
}

// `Released`/`Settled` holds have paid out to the seller.
const PAID_HOLD_STATUSES = new Set(['released', 'settled']);
// A cancelled hold returns the funds — the sale was refunded/reversed. Both spellings are listed
// because the upstream hold status arrives as either the British ('cancelled') or American
// ('canceled') form depending on the source, and we normalize by matching either.
const REFUNDED_HOLD_STATUSES = new Set(['cancelled', 'canceled']);

// Maps a record to its Status, mirroring report-generation-processor's GetLocalizedStatusV2:
// a debit (negative amount) or a cancelled hold is a Refund; a released/settled hold is Paid;
// everything else (hold still active — Active/Held — or unknown) is Pending. Explicit rather than
// "not pending ⇒ paid", so cancelled/unknown values never render as Paid. holdStatus is compared
// case-insensitively since serialization casing varies (Active/ACTIVE/…).
export const getTransactionStatus = (
  holdStatus?: string | null,
  amount?: string | null,
): VirtualTransactionStatus => {
  const normalizedHoldStatus = holdStatus?.toLowerCase();
  const numericAmount = amount != null && amount !== '' ? Number(amount) : Number.NaN;

  if (
    numericAmount < 0 ||
    (normalizedHoldStatus != null && REFUNDED_HOLD_STATUSES.has(normalizedHoldStatus))
  ) {
    return VirtualTransactionStatus.Refunded;
  }
  // No explicit `numericAmount > 0` guard here (unlike the `< 0` debit check above): a debit is
  // already classified as a Refund above, and a released/settled hold is a completed payout even
  // if its amount is zero or absent — so it stays Paid rather than falling through to Pending.
  if (normalizedHoldStatus != null && PAID_HOLD_STATUSES.has(normalizedHoldStatus)) {
    return VirtualTransactionStatus.Paid;
  }
  return VirtualTransactionStatus.Pending;
};

// A cancelled/reversed hold never paid out, so the Amount column shows a dash instead of a value.
export const isCanceledHold = (holdStatus?: string | null): boolean => {
  const normalizedHoldStatus = holdStatus?.toLowerCase();
  return normalizedHoldStatus != null && REFUNDED_HOLD_STATUSES.has(normalizedHoldStatus);
};
