import { AgreementStatus } from '@rbx/client-content-licensing-api/v1';
import type { AgreementStatusBatchItemError } from '../hooks/useAgreementStatusesByIdsQuery';

const AGREEMENT_STATUSES_FOR_VIEW_AGREEMENT = new Set<AgreementStatus>([
  AgreementStatus.ConditionalOffer,
  AgreementStatus.Disputed,
  AgreementStatus.Inquired,
  AgreementStatus.Accepted,
]);

interface CanViewAgreementOptions {
  agreementId?: string | null;
  rowError?: AgreementStatusBatchItemError;
  status?: AgreementStatus;
}

export const canViewAgreement = ({
  agreementId,
  rowError,
  status,
}: CanViewAgreementOptions): boolean =>
  !!agreementId &&
  !rowError &&
  status !== undefined &&
  AGREEMENT_STATUSES_FOR_VIEW_AGREEMENT.has(status);
