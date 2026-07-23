import { Button, Divider } from '@rbx/foundation-ui';
import { AddressElement, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { PaymentMethod, StripeAddressElement, StripePaymentElement } from '@stripe/stripe-js';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  ADD_CREDIT_CARD_SUCCESS,
  PaymentMethodDrawerBroadcastChannel,
} from '@clients/paymentMethodDrawerBroadcastChannel';
import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import useStripeFormStyles from '@components/billing/common/StripeForm.styles';
import { openCardVerificationDialog } from '@components/billing/dialogs/CardVerificationDialog';
import CustomCircularProgress from '@components/common/CustomCircularProgress';
import { openErrorDialog } from '@components/common/dialog/errorDialog';
import { CardVerificationResultEnum, STRIPE_PAYMENT_PROVIDER } from '@constants/billing';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import {
  verifyPaymentProfileCreation,
  VerifyPaymentProfileCreationResponse,
} from '@services/ads/paymentProfileService';
import { retryPaymentCharges } from '@services/ads/paymentService';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { CaptureException } from '@utils/error';
import { GetLocalStorage, StorageKeys } from '@utils/localStorage';
import { PollWithRetryLimitAndCancelCallback } from '@utils/poll';
import { GetRedirectBaseUrl } from '@utils/url';

interface StripeFormProps {
  actionsContainer?: HTMLElement | null;
  centerButtons: boolean;
  isLoading: boolean;
  /** Used with onComplete: closes embedded flow without saving (e.g. drawer). Cancel on standalone pages still navigates. */
  onCancel?: () => void;
  /** When set (e.g. account setup drawer), only invoked on successful verified save — not on errors or cancel */
  onComplete?: () => void;
  redirectRoute?: string;
}

const StripeForm = ({
  actionsContainer,
  centerButtons = false,
  isLoading = true,
  onCancel,
  onComplete,
  redirectRoute,
}: StripeFormProps) => {
  const router = useRouter();
  const { translate: translateBilling } = useNamespacedTranslation(TranslationNamespace.Billing);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const stripe = useStripe();
  const elements = useElements();
  const paymentElementRef = useRef<StripePaymentElement | null>(null);
  const addressElementRef = useRef<StripeAddressElement | null>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [saveDisabled, setSaveDisabled] = useState<boolean>(true);
  const [paymentInfoComplete, setPaymentInfoComplete] = useState<boolean>(false);
  const [addressInfoComplete, setAddressInfoComplete] = useState<boolean>(false);

  const {
    classes: {
      backdrop,
      billingAddressFormHeader,
      bottomDivider,
      buttonContainer,
      buttonRow,
      cancelButton,
      cardHoldReminder,
      circularProgress,
      inProgressText,
      loadingStateContainer,
      stripeFormHeader,
      submitLoadingStateContainer,
    },
  } = useStripeFormStyles();

  const {
    adAccountId = GetLocalStorage(StorageKeys.AD_ACCOUNT_ID),
    adCreditActivated,
    paymentFailure,
    paymentProfiles,
  } = useAppStore((state: AppStoreType) => state.appData);

  const getPaymentProfiles = useAppStore((state: AppStoreType) => state.getPaymentProfiles);

  const hasVerifiedPaymentProfiles = paymentProfiles?.some(
    (paymentProfile) => paymentProfile?.is_verified,
  );

  const showCardVerificationModal = (paymentProfileId: string | null) => {
    openCardVerificationDialog({
      onDismiss: () => setSaveDisabled(true),
      paymentProfileId,
    });
  };

  // Access the Stripe Payment and Address Elements and check if
  // they are completely filled out. Used to disable Save Button.
  useEffect(() => {
    const paymentElement = elements?.getElement('payment');
    const addressElement = elements?.getElement('address');
    paymentElementRef.current = paymentElement ?? null;
    addressElementRef.current = addressElement ?? null;

    paymentElement?.on('change', function (event) {
      setPaymentInfoComplete(event.complete);
    });
    addressElement?.on('change', function (event) {
      setAddressInfoComplete(event.complete);
    });
    setSaveDisabled(!paymentInfoComplete || !addressInfoComplete);

    // Cleanup listeners on unmount
    return () => {
      paymentElement?.off('change');
      addressElement?.off('change');
    };
  }, [elements, paymentInfoComplete, addressInfoComplete]);

  // All pages with the Stripe form should redirect to the Payment
  // Settings page after new payment method is added (unless embedded via onComplete)
  const navigateToPaymentSettingsAfterSave = (state?: CardVerificationResultEnum) => {
    if (redirectRoute) {
      router.push({ pathname: redirectRoute, query: state ? { state } : {} });
      return;
    }
    if (state === undefined) {
      router.push(Routes.PAYMENT_SETTINGS);
    } else if (
      state === CardVerificationResultEnum.SUCCESS &&
      !hasVerifiedPaymentProfiles &&
      !adCreditActivated
    ) {
      router.push({
        pathname: Routes.PAYMENT_SETTINGS,
        query: { state: CardVerificationResultEnum.SUCCESS_AND_FIRST_PAYMENT_METHOD },
      });
    } else {
      router.push({
        pathname: Routes.PAYMENT_SETTINGS,
        query: { state },
      });
    }
  };

  const redirectAfterSave = (state?: CardVerificationResultEnum) => {
    if (onComplete) {
      if (state === CardVerificationResultEnum.SUCCESS) {
        setIsProcessing(false);
        onComplete();
        return;
      }
      if (state === undefined) {
        setIsProcessing(false);
        onCancel?.();
        return;
      }
      setIsProcessing(false);
      openErrorDialog();
      return;
    }
    navigateToPaymentSettingsAfterSave(state);
  };

  // Poll for new payment profile created after saving
  const verifyPaymentProfileCreationPoll = async (
    stripePaymentMethodId: string | null | PaymentMethod,
  ) => {
    try {
      const response = await verifyPaymentProfileCreation(
        STRIPE_PAYMENT_PROVIDER,
        stripePaymentMethodId,
      );

      return response;
    } catch {
      // Don't CaptureException here, as this is a retryable error and too noisy
      return undefined;
    }
  };

  // Determines whether user goes through card verification flow or skips
  // it. If card verification flow is on, new payment profiles will have
  // is_verified=false on the backend.
  const routeVerifyFlow = async ({
    is_removed: isRemoved,
    payment_profile_id: paymentProfileId,
  }: VerifyPaymentProfileCreationResponse) => {
    if (isRemoved) {
      redirectAfterSave(CardVerificationResultEnum.CARD_REMOVED);
      return;
    }

    const response = await getPaymentProfiles(true);
    let profileVerified = false;
    if (response?.data[0] && response.data[0].is_verified) {
      profileVerified = true;
    }
    if (profileVerified) {
      if (paymentFailure) {
        retryPaymentCharges().catch((e) => CaptureException(e as Error));
      }
      redirectAfterSave(CardVerificationResultEnum.SUCCESS);
      PaymentMethodDrawerBroadcastChannel.postMessage(ADD_CREDIT_CARD_SUCCESS);
    } else {
      setIsProcessing(false);
      showCardVerificationModal(paymentProfileId);
    }
  };

  const onSubmitAndVerify = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setIsProcessing(true);

    if (!stripe || !elements) {
      return null;
    }

    // Send new payment method info to Stripe for saving. If save was successful,
    // Stripe will send an object with a Stripe setup intent.
    type AllowRedisplay = 'always' | 'limited' | 'unspecified';
    const allowRedisplayValue: AllowRedisplay = 'always';
    const baseUrl = GetRedirectBaseUrl();
    const stripeConfirmResponse = await stripe.confirmSetup({
      confirmParams: {
        payment_method_data: {
          allow_redisplay: allowRedisplayValue,
        },
        return_url: `${baseUrl}${redirectRoute || Routes.PAYMENT_SETTINGS}`,
      },
      elements,
      redirect: 'if_required',
    });

    // Once we receive the success object from Stripe, poll our backend to make sure
    // we have the new payment method saved on our end. It usually takes 3 sec to get
    // a success response from out backend. If it takes longer than 2 min, redirect
    // the user with an "unknown error" message.
    if (stripeConfirmResponse.setupIntent) {
      try {
        const stripePaymentMethodId = stripeConfirmResponse.setupIntent.payment_method;
        // Poll for verified payment method
        PollWithRetryLimitAndCancelCallback<VerifyPaymentProfileCreationResponse | undefined>({
          fn: () => verifyPaymentProfileCreationPoll(stripePaymentMethodId),
          interval: 3000,
          maxRetries: 10,
          onMaxRetriesReached: () => {
            redirectAfterSave(CardVerificationResultEnum.UNKNOWN_STRIPE_ERROR);
          },
          successCb: async (response) => {
            if (response) {
              await routeVerifyFlow(response);
            }
          },
        });
      } catch (err) {
        CaptureException(err as Error);
        redirectAfterSave(CardVerificationResultEnum.SOMETHING_WENT_WRONG);
      }
    }

    // If there is a...
    // validation error --> show fields with error and scroll to top of page
    // card_error --> means failed to save card, so redirect with card authentication failed error
    // other --> redirect with unknown error
    if (stripeConfirmResponse.error && stripeConfirmResponse.error.type === 'validation_error') {
      setIsProcessing(false);
      window.scrollTo(0, 0);
      // TODO: [3/23/23] Show error state / validation error banner
    } else if (stripeConfirmResponse.error && stripeConfirmResponse.error.type === 'card_error') {
      CaptureException(stripeConfirmResponse.error);
      redirectAfterSave(CardVerificationResultEnum.CARD_AUTHENTICATION_FAILED);
    } else if (stripeConfirmResponse.error) {
      CaptureException(stripeConfirmResponse.error);
      redirectAfterSave(CardVerificationResultEnum.UNKNOWN_STRIPE_ERROR);
    }

    return null;
  };

  const subtitle = (
    <span className={`text-heading-small ${stripeFormHeader}`} data-testid='stripeFormHeader'>
      {hasVerifiedPaymentProfiles
        ? translateBilling('Heading.ReplaceCreditOrDebitCard')
        : translateBilling('Heading.AddCreditOrDebitCard')}
    </span>
  );

  // TODO: [3/20/23] Center loading icon on add payment method page - may not be worth the trouble
  const loadingState = (
    <div className={loadingStateContainer} data-testid='stripeFormLoading'>
      <CustomCircularProgress />
    </div>
  );

  const submitLoadingState = (
    <div className={backdrop} role='presentation'>
      <div className={submitLoadingStateContainer}>
        <CustomCircularProgress className={circularProgress} />
        <span className={`text-body-large ${inProgressText}`}>
          {translateBilling('Description.AuthenticatingCard')}
        </span>
      </div>
    </div>
  );

  const internalActions = (
    <div className={buttonRow}>
      <Button
        className={cancelButton}
        data-testid='cancelButton'
        onClick={() => redirectAfterSave()}
        size='Medium'
        variant='Standard'>
        {translateMisc('Action.Cancel')}
      </Button>
      <Button
        data-testid='saveButton'
        isDisabled={saveDisabled || isProcessing}
        isLoading={isProcessing}
        onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          unifiedLogger.logClickEvent({
            eventName: EventName.PaymentSettingsPageClickSaveCard,
            parameters: { adAccountId },
          });
          onSubmitAndVerify(e)
            .then((_success: unknown) => {
              unifiedLogger.logImpressionEvent({
                eventName: EventName.PaymentSettingsPageVerifiedCard,
                parameters: { adAccountId },
              });
            })
            .catch((err) => {
              CaptureException(err as Error);
              redirectAfterSave(CardVerificationResultEnum.SOMETHING_WENT_WRONG);
            });
        }}
        size='Medium'
        variant='Emphasis'>
        {translateBilling('Action.SaveAndAuthenticate')}
      </Button>
    </div>
  );

  const externalActions = actionsContainer
    ? createPortal(
        <>
          <Button
            className='grow'
            data-testid='saveButton'
            isDisabled={saveDisabled || isProcessing}
            isLoading={isProcessing}
            onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
              unifiedLogger.logClickEvent({
                eventName: EventName.PaymentSettingsPageClickSaveCard,
                parameters: { adAccountId },
              });
              onSubmitAndVerify(e)
                .then((_success: unknown) => {
                  unifiedLogger.logImpressionEvent({
                    eventName: EventName.PaymentSettingsPageVerifiedCard,
                    parameters: { adAccountId },
                  });
                })
                .catch((err) => {
                  CaptureException(err as Error);
                  redirectAfterSave(CardVerificationResultEnum.SOMETHING_WENT_WRONG);
                });
            }}
            size='Medium'
            variant='Emphasis'>
            {translateBilling('Action.SaveAndAuthenticate')}
          </Button>
          <Button
            className='grow'
            data-testid='cancelButton'
            onClick={() => redirectAfterSave()}
            size='Medium'
            variant='Standard'>
            {translateMisc('Action.Cancel')}
          </Button>
        </>,
        actionsContainer,
      )
    : null;

  const stripeFormState = (
    <form data-testid='stripeForm' name='stripeForm'>
      {subtitle}
      <PaymentElement />
      <span
        className={`text-heading-medium ${billingAddressFormHeader}`}
        data-testid='billingAddressFormHeader'>
        {translateBilling('Heading.BillingAddress')}
      </span>
      <AddressElement
        options={{
          defaultValues: {
            address: {
              country: 'US',
              state: 'AL',
            },
          },
          mode: 'billing',
        }}
      />
      <Divider className={bottomDivider} data-testid='bottomDivider' />
      <div className={centerButtons ? buttonContainer : undefined} data-testid='buttonContainer'>
        <div className={cardHoldReminder}>
          <div>
            <span className='text-title-medium' data-testid='cardHoldReminderTitle'>
              {translateBilling('Title.CardHoldReminder')}
            </span>
          </div>
          <div>
            <span className='text-body-medium' data-testid='cardHoldReminder'>
              {translateBilling('Description.CardHoldReminder')}
            </span>
          </div>
        </div>
        {actionsContainer ? null : internalActions}
        {externalActions}
        {isProcessing ? submitLoadingState : null}
      </div>
    </form>
  );

  if (!isLoading) {
    return stripeFormState;
  }
  return loadingState;
};

export default StripeForm;
