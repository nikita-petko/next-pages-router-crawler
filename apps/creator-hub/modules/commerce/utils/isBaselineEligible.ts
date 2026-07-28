import type { BaselineEligibility } from '@modules/clients/commerce';
import { TermsAcceptanceStatus } from '@modules/clients/commerce';

const isBaselineEligible = (baselineEligibility?: BaselineEligibility) => {
  if (!baselineEligibility) {
    return false;
  }

  return (
    baselineEligibility.hasEligibleAge &&
    baselineEligibility.hasVerifiedId &&
    baselineEligibility.hasVerifiedEmail &&
    baselineEligibility.hasBusinessInfo &&
    baselineEligibility.hasEligibleModerationHistory &&
    baselineEligibility.termsAcceptanceStatus === TermsAcceptanceStatus.Accepted
  );
};

export default isBaselineEligible;
