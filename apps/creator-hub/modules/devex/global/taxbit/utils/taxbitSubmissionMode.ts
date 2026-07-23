import {
  TaxOnboardingStatus,
  type TaxOnboardingStatus as TaxOnboardingStatusValue,
} from '@modules/clients/creatorTaxApi';

export type TaxbitSubmissionMode = 'curing' | 'questionnaire';

export const resolveTaxbitSubmissionMode = (
  onboardingStatus: TaxOnboardingStatusValue | undefined,
  forceNewForm: boolean,
): TaxbitSubmissionMode =>
  !forceNewForm && onboardingStatus === TaxOnboardingStatus.CuringRequired
    ? 'curing'
    : 'questionnaire';
