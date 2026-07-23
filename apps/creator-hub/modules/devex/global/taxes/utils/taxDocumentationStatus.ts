export type TaxDocumentationStatusVariant =
  | 'notStarted'
  | 'underReview'
  | 'additionalInfoNeeded'
  | 'curingRequired'
  | 'failed'
  | 'approved';

export const CURRENT_TAX_DOCUMENTATION_STATUS: TaxDocumentationStatusVariant = 'notStarted';

const TAX_ONBOARDING_STATUS_VARIANTS: Record<string, TaxDocumentationStatusVariant> = {
  TAX_ONBOARDING_STATUS_COMPLETE: 'approved',
  TAX_ONBOARDING_STATUS_ADDITIONAL_INFO_REQUIRED: 'additionalInfoNeeded',
  TAX_ONBOARDING_STATUS_CURING_REQUIRED: 'curingRequired',
  TAX_ONBOARDING_STATUS_IN_REVIEW: 'underReview',
  TAX_ONBOARDING_STATUS_INVALID: 'notStarted',
  TAX_ONBOARDING_STATUS_NOT_STARTED: 'notStarted',
  TAX_ONBOARDING_STATUS_RESUBMISSION_REQUIRED: 'failed',
};

export const resolveTaxDocumentationStatusVariant = (
  status: string | undefined,
): TaxDocumentationStatusVariant => {
  return status
    ? (TAX_ONBOARDING_STATUS_VARIANTS[status] ?? CURRENT_TAX_DOCUMENTATION_STATUS)
    : CURRENT_TAX_DOCUMENTATION_STATUS;
};
