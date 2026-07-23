import type { RejectionReason } from '@rbx/client-content-licensing-api/v1';

const rejectionReasonToTranslationKey: { [key in RejectionReason]: string } = {
  NegotiationIntent: 'Label.ModerationRejectionReasonNegotiationIntent',
  FinancialRequest: 'Label.ModerationRejectionReasonFinancialRequest',
  InappropriateLanguage: 'Label.ModerationRejectionReasonInappropriateLanguage',
  HarassingLegalThreat: 'Label.ModerationRejectionReasonHarassingLegalThreat',
  HarmfulContent: 'Label.ModerationRejectionReasonHarmfulContent',
  ExternalContactRequest: 'Label.ModerationRejectionReasonExternalContactRequest',
  GeneralViolation: 'Label.ModerationRejectionReasonGeneric',
  LowQualityInput: 'Label.ModerationRejectionReasonGeneric',
  NotLicenseCompliance: 'Label.ModerationRejectionReasonNotLicenseCompliance',
  RequiresCoreGameplayChange: 'Label.ModerationRejectionReasonGeneric',
  BugOrTechnicalIssue: 'Label.ModerationRejectionReasonGeneric',
  None: 'Label.ModerationRejectionReasonGeneric', // should never actually be surfaced
};

const getKeyFromModerationReason = (reason: RejectionReason | undefined): string => {
  if (reason) {
    const key = rejectionReasonToTranslationKey[reason];
    if (key) {
      return key;
    }
  }
  return 'Label.ModerationRejectionReasonGeneric';
};

export default getKeyFromModerationReason;
