import React, { FunctionComponent, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import billingClient, { LuobuDevexEligibilityEnum as Eligibility } from '@modules/clients/billing';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CashOutForm from './CashOutForm';
import RequestConfirmation from './RequestConfirmation';

const CashOut: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eligibilityResponse =
          await billingClient.LuobuDevexAPI.v1LuobuDeveloperExchangeEligibilityGet();
        if (eligibilityResponse.eligibility !== Eligibility.Eligible) {
          router.push('/dashboard/devex');
        }
      } catch (e) {
        router.push('/dashboard/devex');
      }
    };

    fetchData();
  }, [router]);

  const [submitSuccess, setSubmitState] = useState(false);

  const setSubmitSuccess = () => {
    setSubmitState(true);
  };

  return submitSuccess ? (
    <RequestConfirmation />
  ) : (
    <CashOutForm onSubmitSuccess={setSubmitSuccess} />
  );
};

export default withTranslation(CashOut, [TranslationNamespace.DevEx]);
