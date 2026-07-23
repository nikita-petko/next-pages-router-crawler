import type { AgreementActivityResponse } from '@rbx/client-content-licensing-api/v1';
import { AgreementStatus, CancellationReason } from '@rbx/client-content-licensing-api/v1';

const cancellationReasonToLabelKey: Partial<Record<CancellationReason, string>> = {
  [CancellationReason.NoLongerPlanningToUseIp]: 'Label.NoLongerInterested',
  [CancellationReason.NotReadyForProposedDates]: 'Label.NotReadyByProposedDates',
};

/**
 * Maps API {@link CancellationReason} values to i18n label keys shown in the product.
 */
export const getCancellationReasonLabelKey = (reason: CancellationReason): string => {
  return cancellationReasonToLabelKey[reason] ?? 'Label.Unknown';
};

export const resolveCancellationNotesToLabelKey = (raw: string | undefined | null): string => {
  if (!raw) {
    return 'Label.Unknown';
  }
  if ((Object.values(CancellationReason) as string[]).includes(raw)) {
    return getCancellationReasonLabelKey(raw as CancellationReason);
  }
  return 'Label.Unknown';
};

/**
 * Resolves the translation key for a Creator termination / cancellation from the activity log.
 * Supports {@link CancellationReason} values in activity notes (current API) and legacy
 * `Label.*` strings stored in older activity rows.
 */
export const getCancelReasonLabelKey = (activityLog: AgreementActivityResponse[]): string => {
  if (!activityLog?.length) {
    return resolveCancellationNotesToLabelKey(undefined);
  }
  const agreementActivity = activityLog.find(
    (item) => item.endStatus === AgreementStatus.Cancelled,
  );

  return resolveCancellationNotesToLabelKey(agreementActivity?.notes);
};
