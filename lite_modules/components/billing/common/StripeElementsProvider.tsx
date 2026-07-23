import { Locale as RbxLocale, useLocalization } from '@rbx/intl';
import { useTheme } from '@rbx/ui';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe, StripeElementLocale } from '@stripe/stripe-js';
import { useCallback, useEffect, useState } from 'react';

import StripeForm from '@components/billing/common/StripeForm';
import { openErrorDialog } from '@components/common/dialog/errorDialog';
import { STRIPE_PAYMENT_PROVIDER } from '@constants/billing';
import { createPaymentProfileSetup } from '@services/ads/paymentProfileService';
import { GetStripePublicAPIKeyForEnv } from '@utils/billing';
import { CaptureException } from '@utils/error';

const STRIPE_LOCALE_MAP: Partial<Record<RbxLocale, StripeElementLocale>> = {
  [RbxLocale.Arabic]: 'ar',
  [RbxLocale.BrazilPortuguese]: 'pt-BR',
  [RbxLocale.English]: 'en',
  [RbxLocale.French]: 'fr-FR',
  [RbxLocale.German]: 'de',
  [RbxLocale.Indonesian]: 'id',
  [RbxLocale.Italian]: 'it-IT',
  [RbxLocale.Japanese]: 'ja',
  [RbxLocale.Korean]: 'ko',
  [RbxLocale.SimplifiedChinese]: 'zh',
  [RbxLocale.SimplifiedChineseJV]: 'zh',
  [RbxLocale.Spanish]: 'es-ES',
  [RbxLocale.Thai]: 'th',
  [RbxLocale.TraditionalChinese]: 'zh-TW',
  [RbxLocale.Vietnamese]: 'vi',
};

interface StripeElementsProviderProps {
  actionsContainer?: HTMLElement | null;
  centerButtons?: boolean;
  onCancel?: () => void;
  onComplete?: () => void;
  redirectRoute?: string;
}

// Context Wrapper Component for Stripe iframe. <Elements> wrapper is required by Stripe.
const StripeElementsProvider = ({
  actionsContainer,
  centerButtons = false,
  onCancel,
  onComplete,
  redirectRoute,
}: StripeElementsProviderProps) => {
  const { locale } = useLocalization();
  const stripeLocale = locale ? (STRIPE_LOCALE_MAP[locale as RbxLocale] ?? 'auto') : 'auto';
  const [stripePromise, setStripePromise] = useState<PromiseLike<Stripe | null> | null>(null);
  const [clientSecretKey, setClientSecretKey] = useState<string>('');

  const fetchStripePromise = useCallback(async () => {
    try {
      const stripePublicKey = GetStripePublicAPIKeyForEnv();
      const loadedStripePromise = loadStripe(stripePublicKey);
      setStripePromise(loadedStripePromise);
    } catch (e) {
      CaptureException(e as Error);
      openErrorDialog();
    }
  }, []);

  const getClientSecret = useCallback(async () => {
    await createPaymentProfileSetup({
      payment_provider: STRIPE_PAYMENT_PROVIDER,
    })
      .then((res) => {
        setClientSecretKey(res.provider_payload.client_secret);
      })
      .catch((err) => {
        CaptureException(err as Error);
        openErrorDialog();
      });
  }, []);

  // TODO: [4/6/23] Retry createPaymentProfileSetup if it fails
  // Get Stripe promise and client_secret to render Stripe form
  useEffect(() => {
    fetchStripePromise().catch(CaptureException);
    getClientSecret();
  }, [fetchStripePromise, getClientSecret]);

  // Stripe iframe configuration options
  // Stripe documentation https://docs.stripe.com/js/elements_object/create#stripe_elements-options
  const theme = useTheme();
  type labelType = 'above' | 'floating' | undefined;
  const options = {
    appearance: {
      labels: 'floating' as labelType,
      rules: {
        '.Error': {
          fontSize: '12px',
          marginTop: '4px',
        },
        '.Input': {
          backgroundColor: theme.palette.content.static.dark,
          border: `1px solid ${theme.palette.surface.outline}`,
          borderRadius: '8px',
          color: theme.palette.content.standard,
          lineHeight: '23px',
          padding: '4px 12px',
        },
        '.Label': {
          color: theme.palette.content.muted,
          display: 'block',
          fontSize: '14px',
          fontWeight: '400px',
          marginBottom: '8px',
        },
      },
      variables: {
        colorBackground: theme.palette.content.static.dark,
        colorText: theme.palette.content.muted,
      },
    },
    clientSecret: clientSecretKey,
    locale: stripeLocale,
  };

  if (stripePromise && clientSecretKey) {
    return (
      <Elements options={options} stripe={stripePromise}>
        <StripeForm
          actionsContainer={actionsContainer}
          centerButtons={centerButtons}
          isLoading={false}
          onCancel={onCancel}
          onComplete={onComplete}
          redirectRoute={redirectRoute}
        />
      </Elements>
    );
  }

  // Loading state if stripePromise and clientSecret is not ready
  return (
    <Elements options={{}} stripe={null}>
      <StripeForm
        actionsContainer={actionsContainer}
        centerButtons={centerButtons}
        isLoading
        onCancel={onCancel}
        onComplete={onComplete}
        redirectRoute={redirectRoute}
      />
    </Elements>
  );
};

export default StripeElementsProvider;
