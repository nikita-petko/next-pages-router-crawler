import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useState } from 'react';
import { AccountStatusEnum } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Step, StepLabel, Stepper } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { CLAIMS_HREF, REMOVAL_REQUESTS_HREF } from '../../urls';
import EligibilityView from './EligibilityView';
import RegistrationFormView from './RegistrationFormView';

/**
 * RegistrationContainer is the landing page to register for a new account
 */
const RegistrationContainer: FunctionComponent<React.PropsWithChildren> = () => {
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
      router.push(CLAIMS_HREF);
    } else {
      router.push(REMOVAL_REQUESTS_HREF);
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
