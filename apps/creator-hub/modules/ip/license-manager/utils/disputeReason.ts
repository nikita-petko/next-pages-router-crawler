import {
  DisputeReason,
  type AgreementResponse,
  type HydratedAgreementWithHydratedTargetsResponse,
} from '@rbx/clients/contentLicensingApi/v1';

/**
 * Hard-coded value that represents the maximum allowed number of disputes against an
 * IPH-offered license before it becomes unsuccessful. This should match the unexposed
 * backend value found here:
 *
 * Roblox/rights repo > services/rights-management-api/configs/config.yaml
 * # Agreement disputes
 * max_agreement_disputes: 2
 */
export const MAX_DISPUTE_ATTEMPTS = 2;

const disputeReasonToLabelKey: Partial<Record<DisputeReason, string>> = {
  [DisputeReason.FairUse]: 'Label.DisputeReasonFairUse',
  [DisputeReason.IPNotUsed]: 'Label.DisputeReasonNotUsingIP',
  [DisputeReason.IPRemoved]: 'Label.DisputeReasonIPRemoved',
};

/**
 * Get the translation key corresponding to the latest dispute reason. Otherwise, unknown.
 */
export const getLatestDisputeReasonLabelKey = (
  agreement: AgreementResponse | HydratedAgreementWithHydratedTargetsResponse,
) => {
  const disputeReasons = agreement.disputeReasons || [];
  const reason = disputeReasons[disputeReasons.length - 1] as DisputeReason | undefined;
  return reason ? (disputeReasonToLabelKey[reason] ?? 'Label.Unknown') : 'Label.Unknown';
};

export const isNextDisputeFinal = (
  agreement: AgreementResponse | HydratedAgreementWithHydratedTargetsResponse,
) => {
  const disputeReasons = agreement.disputeReasons || [];
  return disputeReasons.length + 1 === MAX_DISPUTE_ATTEMPTS;
};

export const getReasonFromString = (key: string): string => {
  return disputeReasonToLabelKey[key as DisputeReason] ?? 'Label.Unknown';
};
