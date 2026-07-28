import type {
  CurrencyHolderType,
  LedgerReason,
  TransactionRecordsResponse,
} from '@modules/clients/transactionRecords';
import transactionRecordsClient, {
  salesReportDownloadClient,
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
