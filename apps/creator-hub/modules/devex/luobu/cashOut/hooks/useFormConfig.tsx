import { useCallback, useEffect, useState } from 'react';
import billingClient from '@modules/clients/billing';
import { regex } from '@rbx/core';
import { useTranslation } from '@rbx/intl';

import { Value } from './useForm';

const useFormConfig = () => {
  const { translate } = useTranslation();

  const required = (value: Value): string =>
    value === undefined || value === null || value === '' ? translate('Message.RequiredField') : '';

  const isEmail = (value: Value): string =>
    regex.email.test(value) ? '' : translate('Message.InvalidEmail');

  const minAmount =
    (amount: number) =>
    (value: Value): string =>
      value >= amount ? '' : translate('Message.MinimumAmount', { amount: String(amount) });

  const maxAmount =
    (amount: number) =>
    (value: Value): string =>
      value <= amount ? '' : translate('Message.MaximumAmount', { amount: String(amount) });

  const agreeToTerms = (value: Value): string =>
    value === undefined || value === null || value === false
      ? translate('Message.AgreeToTermsOfService')
      : '';

  const initialValues = {
    firstName: '',
    lastName: '',
    email: '',
    amount: 0,
    termsOfService: false,
  };

  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const balanceResponse =
        await billingClient.LuobuDevexAPI.v1LuobuDeveloperExchangeBalanceGet();
      if (balanceResponse.amount) {
        setBalance(Math.floor(balanceResponse.amount));
      }
    };
    fetchData();
  }, []);

  const maxAmountByBalance = useCallback(maxAmount(balance), [balance]);

  const validationRules = {
    firstName: [required],
    lastName: [required],
    email: [required, isEmail],
    amount: [required, minAmount(700), maxAmountByBalance],
    termsOfService: [agreeToTerms],
  };

  return {
    balance,
    initialValues,
    validationRules,
  };
};

export default useFormConfig;
