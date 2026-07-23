import React, { FunctionComponent, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRouter } from 'next/router';
import { PageLoading } from '@modules/miscellaneous/common';
import { Step, StepLabel, Stepper } from '@rbx/ui';
import { AccountStatusEnum } from '@rbx/clients/rightsV1';
import EligibilityView from './EligibilityView';
import RegistrationFormView from './RegistrationFormView';
import { RemovalRequestsURL } from '../removalRequests/RemovalRequestsContainer';
import { ClaimsURL } from '../claims/ClaimsContainer';
import { useCurrentAccountContext } from '../../../components/AccountProvider';

export const RegistrationURL = `/dashboard/rights-manager/apply`;

/**
 * RegistrationContainer is the landing page to register for a new account
 */
const RegistrationContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const router = useRouter();
  const { ready, translate } = useTranslation();
  const { account, features } = useCurrentAccountContext();

  const [step, setStep] = useState(0);

  if (!ready) {
    return <PageLoading />;
  }

  // allow unverified shadow accounts to apply for account
  if (account && account.id && account.status !== AccountStatusEnum.Unverified) {
    if (features?.enableClaimsAndDisputes) {
      router.push(ClaimsURL);
    } else {
      router.push(RemovalRequestsURL);
    }
    return null;
  }

  const stepper = (
    <Stepper activeStep={step} orientation='horizontal'>
      <Step>
        <StepLabel>{translate('Label.RegistrationStepVerifyIdentity')}</StepLabel>
      </Step>
      <Step>
        <StepLabel>{translate('Label.RegistrationStepFillForm')}</StepLabel>
      </Step>
    </Stepper>
  );
  // Step 0: Eligibility View
  if (step === 0) {
    return <EligibilityView stepper={stepper} setStep={setStep} hideTitle />;
  }
  return <RegistrationFormView stepper={stepper} onBack={() => setStep(0)} hideTitle />;
};

export default withTranslation(RegistrationContainer, [
  TranslationNamespace.GenreType,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Error,
  TranslationNamespace.RightsPortal,
]);
