import { useEffect, useState } from 'react';
import { regex } from '@rbx/core';
import { useAuthentication } from '@modules/authentication/providers';
import type { GetDevExInfoResponse } from '@modules/clients/economy';
import economyClient from '@modules/clients/economy';

export const sanitizeRobuxAmountInput = (value: number | string): string => {
  const valueWithoutSpaces = String(value).replaceAll(/\s/g, '');
  const decimalIndex = valueWithoutSpaces.indexOf('.');
  const integerPart =
    decimalIndex === -1 ? valueWithoutSpaces : valueWithoutSpaces.slice(0, decimalIndex);
  return integerPart.replaceAll(/\D/g, '');
};

export default function GetFormValidation(
  translate: (key: string, args?: { [key: string]: string }) => string,
  cashOutInfo: GetDevExInfoResponse,
) {
  const [userRobux, setUserRobux] = useState<number>();

  const { user } = useAuthentication();

  useEffect(() => {
    const fetchUserRobux = async () => {
      if (user && user.id) {
        const userCurrency = await economyClient.getUserCurrency(user.id);
        setUserRobux(userCurrency.robux);
      }
    };
    void fetchUserRobux();
  }, [user]);

  const maxRobuxCanCashout = Math.min(cashOutInfo.maxRobuxCanCashOut ?? 0, userRobux ?? 0);

  const validateName = {
    required: translate('Message.RequiredField'),
    pattern: {
      value: /^[a-zA-Z ]+$/,
      message: translate('Message.InvalidName'),
    },
  };

  const validateEmail = {
    required: translate('Message.RequiredField'),
    pattern: {
      value: regex.email,
      message: translate('Message.InvalidEmailV2'),
    },
  };

  const validatePassword = {
    required: translate('Message.RequiredField'),
  };

  const validateRobux = {
    required: translate('Message.InvalidRobuxAmount'),
    setValueAs: (v: string): number | undefined => {
      const sanitizedValue = sanitizeRobuxAmountInput(v);
      if (sanitizedValue !== '') {
        return Number(sanitizedValue);
      }
      return undefined;
    },
    min: {
      value: cashOutInfo.minRobuxToCashOut ?? 0,
      message: cashOutInfo.minRobuxToCashOut?.toLocaleString()
        ? translate('Message.MinimumAmountV2', {
            amount: cashOutInfo.minRobuxToCashOut?.toLocaleString(),
          })
        : '',
    },
    max: {
      value: maxRobuxCanCashout,
      message: maxRobuxCanCashout.toLocaleString()
        ? translate('Message.MaximumAmountV2', {
            amount: maxRobuxCanCashout.toLocaleString(),
          })
        : '',
    },
  };

  return {
    validateName,
    validateEmail,
    validatePassword,
    validateRobux,
    userRobux,
  };
}
