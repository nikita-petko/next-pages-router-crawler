import {
  SalesReportDownloadApi,
  TransactionRecordsApi,
} from '@rbx/client-transaction-records-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

const defaultConfig = createClientConfiguration('transaction-records-api', 'bedev2');

export {
  CurrencyHolderType,
  LedgerReason,
  LedgerDomain,
  TransactionEntityType,
} from '@rbx/client-transaction-records-api/v1';

export type {
  TransactionRecord,
  TransactionRecordsResponse,
  TransactionEntity,
  TransactionRecordsApi as TransactionRecordsClient,
} from '@rbx/client-transaction-records-api/v1';

// v2 transaction records ledger. The `transactionRecordsGetUserTransactions` /
// `transactionRecordsGetGroupTransactions` methods hit the /v2 endpoints; the
// `...V1`-suffixed methods are the older /v1 shape and are intentionally unused.
const transactionRecordsClient = new TransactionRecordsApi(defaultConfig);

// Publishes async sales-report-download requests (same endpoint the personal
// "my transactions" page uses).
export const salesReportDownloadClient = new SalesReportDownloadApi(defaultConfig);

export default transactionRecordsClient;
