import { useQuery } from '@tanstack/react-query';
import type { MetadataResponse } from '@rbx/client-core-content-transaction-api/v1';
import coreContentTransactionClient from '@modules/clients/coreContentTransactions';
import { TransientQueryRetry, transientQueryRetryDelay } from '../constants/audienceReachConstants';

export const transactionMetadataQueryKey = ['coreContentTransaction', 'metadata'] as const;

export const useCoreContentTransactionMetadata = () => {
  return useQuery({
    queryKey: transactionMetadataQueryKey,
    queryFn: async (): Promise<MetadataResponse> =>
      coreContentTransactionClient.coreContentTransactionGetMetadata(),
    retry: TransientQueryRetry,
    retryDelay: transientQueryRetryDelay,
  });
};
