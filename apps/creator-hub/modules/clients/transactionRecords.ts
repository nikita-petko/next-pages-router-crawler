import {
  SalesReportDownloadApi,
  TransactionHistoryApi,
  TransactionRecordsApi,
} from '@rbx/client-transaction-records-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

const defaultConfig = createClientConfiguration('transaction-records-api', 'bedev2');
// Roblox Select transfers are served from the `transaction-records` gateway path (same OpenAPI
// client shapes, different bedev2 service name). Keep this separate so existing v2 callers stay on
// `transaction-records-api`.
const transactionRecordsV1Config = createClientConfiguration('transaction-records', 'bedev2');

export {
  CurrencyHolderType,
  LedgerReason,
  LedgerDomain,
  TransactionEntityType,
  TransactionType,
  AgentType,
  ItemPricingType,
} from '@rbx/client-transaction-records-api/v1';

export type {
  TransactionRecord,
  TransactionRecordsResponse,
  TransactionEntity,
  TransactionRecordsApi as TransactionRecordsClient,
  TransactionRecordResponse,
  TransactionResponse,
} from '@rbx/client-transaction-records-api/v1';

// v2 transaction records ledger. The `transactionRecordsGetUserTransactions` /
// `transactionRecordsGetGroupTransactions` methods hit the /v2 endpoints.
const transactionRecordsClient = new TransactionRecordsApi(defaultConfig);

// Publishes async sales-report-download requests (same endpoint the personal
// "my transactions" page uses).
export const salesReportDownloadClient = new SalesReportDownloadApi(defaultConfig);

// v1 Roblox Select history on `transaction-records` (limit + opaque cursor paging).
// Group: TransactionHistoryApi → GET /v1/groups/{groupId}/transactions
// User:  TransactionRecordsApi → GET /v1/users/{userId}/transactions (…GetUserTransactionsV1)
export const robloxSelectTransactionHistoryClient = new TransactionHistoryApi(
  transactionRecordsV1Config,
);
export const robloxSelectTransactionRecordsClient = new TransactionRecordsApi(
  transactionRecordsV1Config,
);

export default transactionRecordsClient;
