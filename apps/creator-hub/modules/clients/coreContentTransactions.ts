import { CoreContentTransactionApi } from '@rbx/client-core-content-transaction-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

const defaultConfig = createClientConfiguration('core-content', 'bedev2');

export { TransactionVariantEnum } from '@rbx/client-core-content-transaction-api/v1';

export { type CoreContentTransactionApi as CoreContentTransactionClient } from '@rbx/client-core-content-transaction-api/v1';
const coreContentTransactionClient = new CoreContentTransactionApi(defaultConfig);
export default coreContentTransactionClient;
