import { useQuery } from '@tanstack/react-query';
import type {
  TransactionVariantEnum,
  UniverseTransactionStatusResponse,
} from '@rbx/client-core-content-transaction-api/v1';
import coreContentTransactionClient from '@modules/clients/coreContentTransactions';

export const transactionStatusQueryKey = (universeId: number, variant: TransactionVariantEnum) =>
  ['coreContentTransaction', 'transactionStatus', universeId, variant] as const;

export const useCoreContentTransactionStatus = (
  universeId: number,
  variant: TransactionVariantEnum,
) => {
  return useQuery({
    queryKey: transactionStatusQueryKey(universeId, variant),
    queryFn: async (): Promise<UniverseTransactionStatusResponse> =>
      coreContentTransactionClient.coreContentTransactionGetStatus({ universeId, variant }),
    enabled: !!universeId,
  });
};
