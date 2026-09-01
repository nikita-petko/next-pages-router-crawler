import type {
  CurrencyHolderType,
  LedgerReason,
  TransactionRecordResponse,
  TransactionRecordsResponse,
  TransactionResponse,
} from '@modules/clients/transactionRecords';
import transactionRecordsClient, {
  ItemPricingType,
  robloxSelectTransactionHistoryClient,
  robloxSelectTransactionRecordsClient,
  salesReportDownloadClient,
  TransactionType,
} from '@modules/clients/transactionRecords';

export type GetUserTransactionsParams = {
  userId: number;
  ledgerReason?: LedgerReason;
  cursor?: string;
  limit?: number;
  startTimeMillis?: number;
  endTimeMillis?: number;
};

export type GetGroupTransactionsParams = {
  groupId: number;
  ledgerReason?: LedgerReason;
  cursor?: string;
  limit?: number;
  startTimeMillis?: number;
  endTimeMillis?: number;
};

export const getUserTransactions = async (
  params: GetUserTransactionsParams,
): Promise<TransactionRecordsResponse> =>
  transactionRecordsClient.transactionRecordsGetUserTransactions(params);

export const getGroupTransactions = async (
  params: GetGroupTransactionsParams,
): Promise<TransactionRecordsResponse> =>
  transactionRecordsClient.transactionRecordsGetGroupTransactions(params);

export type RobloxSelectTransactionRow = TransactionRecordResponse | TransactionResponse;

export type RobloxSelectTransactionsPage = {
  data: RobloxSelectTransactionRow[];
  nextPageCursor?: string | null;
  previousPageCursor?: string | null;
};

export type GetUserRobloxSelectTransactionsParams = {
  userId: number;
  // Opaque v1 `nextPageCursor` from the previous page. Omit / empty for the first page.
  cursor?: string;
  limit?: number;
};

export type GetGroupRobloxSelectTransactionsParams = {
  groupId: number;
  // Opaque v1 `nextPageCursor` from the previous page. Omit / empty for the first page.
  cursor?: string;
  limit?: number;
};

/**
 * User Roblox Select transfers: GET /v1/users/{userId}/transactions?transactionType=RobloxSelectTransfer
 * on `transaction-records`. Paging is `limit` + opaque `cursor` (client 2.0.0 flattened params).
 */
export const getUserRobloxSelectTransactions = async (
  params: GetUserRobloxSelectTransactionsParams,
): Promise<RobloxSelectTransactionsPage> => {
  const page = await robloxSelectTransactionRecordsClient.transactionRecordsGetUserTransactionsV1({
    userId: params.userId,
    transactionType: TransactionType.RobloxSelectTransfer,
    itemPricingType: ItemPricingType.All,
    limit: params.limit ?? 10,
    cursor: params.cursor,
  });
  return {
    data: page.data ?? [],
    nextPageCursor: page.nextPageCursor,
    previousPageCursor: page.previousPageCursor,
  };
};

/**
 * Group Roblox Select transfers: GET /v1/groups/{groupId}/transactions?transactionType=RobloxSelectTransfer
 * on `transaction-records`. Paging is `limit` + opaque `cursor` (client 2.0.0 flattened params).
 */
export const getGroupRobloxSelectTransactions = async (
  params: GetGroupRobloxSelectTransactionsParams,
): Promise<RobloxSelectTransactionsPage> => {
  const page = await robloxSelectTransactionHistoryClient.transactionHistoryGetGroupTransactions({
    groupId: params.groupId,
    transactionType: TransactionType.RobloxSelectTransfer,
    limit: params.limit ?? 10,
    cursor: params.cursor,
  });
  return {
    data: page.data ?? [],
    nextPageCursor: page.nextPageCursor,
    previousPageCursor: page.previousPageCursor,
  };
};

export type PublishSalesReportDownloadParams = {
  targetId: number;
  targetType: CurrencyHolderType;
  // Inclusive date bounds as ISO strings (parsed invariant/UTC server-side).
  startDate: string;
  endDate: string;
};

// Queues generation of a virtual sales report for the target virtual + date range.
// The report is delivered asynchronously; the server returns 409 if one is already
// in progress for the same window.
//
// NOTE: In client >=1.1.0 `salesReportDownloadPublishSalesReportDownloadMessage` targets
// POST /v2/sales/sales-report-download (the report-generation-service path that actually
// produces this report). Do NOT switch to `...MessageV1` — that is the legacy /v1 route,
// which does not generate the virtual sales report.
export const publishSalesReportDownload = async (
  params: PublishSalesReportDownloadParams,
): Promise<void> => {
  await salesReportDownloadClient.salesReportDownloadPublishSalesReportDownloadMessage({
    salesReportDownloadPublishSalesReportDownloadMessageRequest: params,
  });
};
