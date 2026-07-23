import { useQuery } from '@tanstack/react-query';
import {
  AgreementStatus,
  type BatchGetAgreementStatusByIdsResponse,
} from '@rbx/client-content-licensing-api/v1';
import contentLicensingClient from '@modules/clients/contentLicensing';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { GET_AGREEMENT_STATUSES_BY_IDS_QUERY_KEY } from '../../queryKeys';

export type AgreementStatusBatchItemError = {
  code: number;
  message: string;
};

export type AgreementStatusesBatchData = {
  statusesByAgreementId: Record<string, AgreementStatus>;
  errorsByAgreementId: Record<string, AgreementStatusBatchItemError>;
};

const agreementStatusValueSet = new Set<string>(Object.values(AgreementStatus) as string[]);

const isAgreementStatus = (value: unknown): value is AgreementStatus =>
  typeof value === 'string' && agreementStatusValueSet.has(value);

/**
 * Normalizes {@link BatchGetAgreementStatusByIdsResponse} into lookup maps for the matches UI.
 * If the same `agreementId` appears more than once, later entries override earlier ones.
 */
export const parseBatchGetAgreementStatusByIdsResponse = (
  response: BatchGetAgreementStatusByIdsResponse,
): AgreementStatusesBatchData =>
  (response.results ?? []).reduce<AgreementStatusesBatchData>(
    (acc, row) => {
      if (!row) {
        return acc;
      }

      const err = row.error;
      if (err?.agreementId) {
        const id = err.agreementId;
        const statusesByAgreementId = { ...acc.statusesByAgreementId };
        const errorsByAgreementId = { ...acc.errorsByAgreementId };
        errorsByAgreementId[id] = {
          code: err.code ?? 0,
          message: err.message ?? '',
        };
        delete statusesByAgreementId[id];
        return { statusesByAgreementId, errorsByAgreementId };
      }

      const val = row.value;
      const id = val?.agreementId;
      if (!id) {
        return acc;
      }

      const status = val?.status;
      if (status == null || !isAgreementStatus(status)) {
        return acc;
      }

      const statusesByAgreementId = { ...acc.statusesByAgreementId };
      const errorsByAgreementId = { ...acc.errorsByAgreementId };
      statusesByAgreementId[id] = status;
      delete errorsByAgreementId[id];
      return { statusesByAgreementId, errorsByAgreementId };
    },
    { statusesByAgreementId: {}, errorsByAgreementId: {} },
  );

/** Status map only; see {@link AgreementStatusesBatchData} for full batch payload. */
export type AgreementStatusesById = AgreementStatusesBatchData['statusesByAgreementId'];

const uniqueSortedIds = (agreementIds: readonly string[] | undefined): string[] => {
  if (!agreementIds?.length) {
    return [];
  }
  return [...new Set(agreementIds.filter((id): id is string => !!id))].sort();
};

interface UseAgreementStatusesByIdsQueryParams {
  /** Non-empty agreement ids from agreement candidates (omit rows without an agreement). */
  agreementIds: readonly string[] | undefined;
  /**
   * When false, the batch status query does not run. Matches passes true to load the status column.
   * Defaults to false.
   */
  enabled?: boolean;
}

/**
 * Fetches agreement status for a batch of agreement ids. Depends on list data (e.g. matches)
 * supplying ids; candidates without an agreement id are not passed here and are handled in the UI.
 */
export const useAgreementStatusesByIdsQuery = ({
  agreementIds,
  enabled: enabledOption = false,
}: UseAgreementStatusesByIdsQueryParams) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  const normalizedAgreementIds = uniqueSortedIds(agreementIds);
  const agreementIdsFingerprint = normalizedAgreementIds.length
    ? normalizedAgreementIds.join('\u001E')
    : '';

  return useQuery({
    queryKey: GET_AGREEMENT_STATUSES_BY_IDS_QUERY_KEY(accountId, agreementIdsFingerprint),
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      const raw = await contentLicensingClient.batchGetAgreementStatusByIds(
        accountId,
        normalizedAgreementIds,
      );
      return parseBatchGetAgreementStatusByIdsResponse(raw);
    },
    enabled: !!accountId && normalizedAgreementIds.length > 0 && enabledOption,
  });
};
