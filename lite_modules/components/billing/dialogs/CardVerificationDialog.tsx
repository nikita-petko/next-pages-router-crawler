import { Button, Divider, IconButton, Link } from '@rbx/foundation-ui';
import { DialogContent, Grid, TextField, UIThemeProvider } from '@rbx/ui';
import { useRouter } from 'next/router';
import { type ReactElement, useEffect, useRef, useState } from 'react';

import {
  ADD_CREDIT_CARD_SUCCESS,
  PaymentMethodDrawerBroadcastChannel,
} from '@clients/paymentMethodDrawerBroadcastChannel';
import useCardVerificationModalStyles from '@components/billing/common/CardVerificationModal.styles';
import CustomCircularProgress from '@components/common/CustomCircularProgress';
import { openDialog } from '@components/common/dialog/actions';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import { CardVerificationResultEnum } from '@constants/billing';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import {
  startPaymentProfileChallenge,
  verifyPaymentProfileChallenge,
} from '@services/ads/paymentProfileChallengeService';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { CaptureException } from '@utils/error';

interface CardVerificationDialogProps extends BaseInjectedDialogProps {
  /** Optional side-effect when the dialog closes without a redirect. */
  onDismiss?: () => void;
  paymentProfileId: string | null;
}

const CardVerificationDialog = ({
  onClose,
  onDismiss,
  paymentProfileId,
  setDismissible,
}: CardVerificationDialogProps): ReactElement => {
  const { translate: translateBilling, translateHTML: translateBillingHTML } =
    useNamespacedTranslation(TranslationNamespace.Billing);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const {
    classes: {
      buttonContainer,
      incorrectPin,
      incorrectPinInput,
      linkText,
      loadingTextContainer,
      pinInputContainer,
      progressBarContainer,
      skipButton,
      verifyCardModalCloseButton,
      verifyCardModalContainer,
      verifyCardModalHeader,
      verifyCardModalHelpText,
      verifyCardModalText,
      verifyCardModalTextLine1,
      verifyCardModalTextLine2,
      verifyCardModalTextLinesContainer,
      verifyCardPinInput,
    },
  } = useCardVerificationModalStyles();
  const { adCreditActivated, paymentProfiles } = useAppStore(
    (state: AppStoreType) => state.appData,
  );

  const hasVerifiedPaymentProfiles = paymentProfiles.some(
    (paymentProfile) => paymentProfile?.is_verified,
  );
  const [isVerifyLoading, setIsVerifyLoading] = useState<boolean>(false);
  const [isResendLoading, setIsResendLoading] = useState<boolean>(false);
  const [inputOne, setInputOne] = useState<string>('');
  const [inputTwo, setInputTwo] = useState<string>('');
  const [inputThree, setInputThree] = useState<string>('');
  const [inputFour, setInputFour] = useState<string>('');
  const [failedAttempt, setFailedAttempt] = useState<boolean>(false);
  const [resendCode, setResendCode] = useState<boolean>(false);

  const router = useRouter();

  useEffect(() => {
    setDismissible(false);
    return () => {
      setDismissible(true);
    };
    // Injected by the outlet; omit from deps to avoid re-running when the
    // outlet recreates the callback after dismissible state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeDialog = (): void => {
    onDismiss?.();
    onClose();
  };

  // Passes state in URL when redirecting
  const redirectWithState = (state?: CardVerificationResultEnum) => {
    if (router.pathname.includes('addpaymentmethod')) {
      if (state === CardVerificationResultEnum.SUCCESS) {
        PaymentMethodDrawerBroadcastChannel.postMessage(ADD_CREDIT_CARD_SUCCESS);
      }
      // If user just finished adding a new payment method, redirect them to the payment settings page
      if (
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
    } else if (state === undefined) {
      closeDialog();
      return;
    } else {
      // Otherwise, "reload" the page with the new state passed in
      router.push({
        pathname: router.pathname,
        query: { state },
      });
    }
    onClose();
  };

  // If user just finished adding a new payment method, redirect them to the payment settings page with a success message.
  // Used to distinguish between the verifying the card when initially adding the payment method or later on by clicking
  // on the "VERIFY CARD" button on the banner.
  const routeResult = () => {
    if (router.pathname.includes('addpaymentmethod')) {
      redirectWithState(CardVerificationResultEnum.SUCCESS);
    } else {
      redirectWithState();
    }
  };

  // Check if all four digits are entered. Used to disable the "Verify" button.
  const checkInputs = (): boolean | undefined => !(inputOne && inputTwo && inputThree && inputFour);

  // Check if pin code is correct.
  const verifyPinCode = async () => {
    setIsVerifyLoading(true);
    const pinCode = inputOne + inputTwo + inputThree + inputFour;
    await verifyPaymentProfileChallenge(paymentProfileId, pinCode)
      .then((response) => {
        if (response.success) {
          redirectWithState(CardVerificationResultEnum.SUCCESS);
        } else if (response.remaining_attempt === 0) {
          setResendCode(true);
          setIsVerifyLoading(false);
        } else {
          setFailedAttempt(true);
          setIsVerifyLoading(false);
        }
      })
      .catch((err: Error) => {
        CaptureException(err);
        redirectWithState(CardVerificationResultEnum.UNKNOWN_STRIPE_ERROR);
      });
  };

  // Start a new payment profile challenge if the user fails and requests a new code
  const sendNewCode = async () => {
    setIsResendLoading(true);
    await startPaymentProfileChallenge(paymentProfileId)
      .then(() => {
        setInputOne('');
        setInputTwo('');
        setInputThree('');
        setInputFour('');
        setFailedAttempt(false);
        setResendCode(false);
        setIsResendLoading(false);
      })
      .catch((err: Error) => {
        CaptureException(err);
        redirectWithState(CardVerificationResultEnum.UNKNOWN_STRIPE_ERROR);
      });
  };

  // TODO: Replace with the translationHtml function
  const verifyPinDescription = (
    <div className={verifyCardModalTextLinesContainer}>
      <span
        className={`text-body-large ${verifyCardModalTextLine1}`}
        data-testid='verifyCardModalTextLine1'>
        {translateBilling('Message.TemporaryHold')}
      </span>
      <span
        className={`text-body-large ${verifyCardModalTextLine2}`}
        dangerouslySetInnerHTML={{
          __html: translateBilling('Description.VerifyCardInstructions', {
            '{boldEnd}': '</strong>',
            '{boldStart}': '<strong>',
          }),
        }}
        data-testid='verifyCardModalTextLine2'
      />
    </div>
  );

  // TODO: Replace with the translationHtml function
  const verifyPinFailedDescription = (
    <span
      className={`text-body-large ${verifyCardModalTextLine1}`}
      dangerouslySetInnerHTML={{
        __html: translateBilling('Description.VerificationFail', {
          '{boldEnd}': '</strong>',
          '{boldStart}': '<strong>',
        }),
      }}
      data-testid='verifyCardModalTextLine2'
    />
  );

  // Show incorrect pin message underneath input boxes
  const incorrectPinState = (
    <span className={`text-body-medium ${incorrectPin}`} data-testid='incorrectPinText'>
      {translateBilling('Warning.IncorrectPin')}
    </span>
  );

  // Show loading messages and spinner
  const verifyLoadingState = (
    <DialogContent className={verifyCardModalContainer} data-testid='verifyCardModalContainer'>
      <IconButton
        ariaLabel={translateBilling('Description.CloseButton')}
        className={verifyCardModalCloseButton}
        data-testid='verifyCardModalCloseButton'
        icon='icon-regular-x'
        onClick={routeResult}
        variant='Utility'
      />
      <span
        className={`text-heading-medium ${verifyCardModalHeader}`}
        data-testid='verifyCardModalHeader'>
        {translateBilling('Action.VerifyCard')}
      </span>
      <Divider data-testid='firstDivider' />
      <div className={progressBarContainer} data-testid='stripeFormLoading'>
        <CustomCircularProgress />
      </div>
      <span className={`text-body-large ${loadingTextContainer}`} data-testid='loadingText'>
        {translateBilling('Description.VerifyingCard')}
      </span>
    </DialogContent>
  );

  // Show requesting new pin message and spinner
  const resendLoadingState = (
    <DialogContent className={verifyCardModalContainer} data-testid='verifyCardModalContainer'>
      <IconButton
        ariaLabel={translateBilling('Description.CloseButton')}
        className={verifyCardModalCloseButton}
        data-testid='verifyCardModalCloseButton'
        icon='icon-regular-x'
        onClick={routeResult}
        variant='Utility'
      />
      <span
        className={`text-heading-medium ${verifyCardModalHeader}`}
        data-testid='verifyCardModalHeader'>
        {translateBilling('Action.VerifyCard')}
      </span>
      <Divider data-testid='firstDivider' />
      <div className={progressBarContainer} data-testid='stripeFormLoading'>
        <CustomCircularProgress />
      </div>
      <span className={`text-body-large ${loadingTextContainer}`} data-testid='loadingText'>
        {translateBilling('Description.RequestingNewCode')}
      </span>
    </DialogContent>
  );

  // Show failed attempts message and allow user to request a new pin
  const resendPinState = (
    <DialogContent className={verifyCardModalContainer} data-testid='verifyCardModalContainer'>
      <IconButton
        ariaLabel={translateBilling('Description.CloseButton')}
        className={verifyCardModalCloseButton}
        data-testid='verifyCardModalCloseButton'
        icon='icon-regular-x'
        onClick={routeResult}
        variant='Utility'
      />
      <span
        className={`text-heading-medium ${verifyCardModalHeader}`}
        data-testid='verifyCardModalHeader'>
        {translateBilling('Action.VerifyCard')}
      </span>
      <Divider data-testid='firstDivider' />
      {verifyPinFailedDescription}
      <span
        className={`text-body-medium ${verifyCardModalHelpText}`}
        data-testid='verifyCardModalHelpText'>
        {translateBillingHTML('Description.VerifyCardHelpLink', [
          {
            closing: 'linkEnd',
            content: (chunks) => (
              <Link className={linkText} data-testid='verifyCardModalHelpLink' href={Routes.HOME}>
                {chunks}
              </Link>
            ),
            opening: 'linkStart',
          },
        ])}
      </span>
      <Divider data-testid='secondDivider' />
      <div className={buttonContainer} data-testid='buttonContainer'>
        <Button
          className={skipButton}
          data-testid='skipButton'
          onClick={routeResult}
          size='Medium'
          variant='Standard'>
          {translateBilling('Action.Skip')}
        </Button>
        <Button
          data-testid='requestNewCodeButton'
          onClick={sendNewCode}
          size='Medium'
          variant='Emphasis'>
          {translateBilling('Action.RequestNewCode')}
        </Button>
      </div>
    </DialogContent>
  );

  // For auto-tabbing
  const inputRef1 = useRef<HTMLInputElement>(null);
  const inputRef2 = useRef<HTMLInputElement>(null);
  const inputRef3 = useRef<HTMLInputElement>(null);
  const inputRef4 = useRef<HTMLInputElement>(null);

  // Initial state
  const pinInputState = (
    <DialogContent className={verifyCardModalContainer} data-testid='verifyCardModalContainer'>
      <IconButton
        ariaLabel={translateBilling('Description.CloseButton')}
        className={verifyCardModalCloseButton}
        data-testid='verifyCardModalCloseButton'
        icon='icon-regular-x'
        onClick={routeResult}
        variant='Utility'
      />
      <span
        className={`text-heading-medium ${verifyCardModalHeader}`}
        data-testid='verifyCardModalHeader'>
        {translateBilling('Action.VerifyCard')}
      </span>
      <Divider data-testid='firstDivider' />
      {verifyPinDescription}
      <Grid className={pinInputContainer} container data-testid='pinInputContainer'>
        <Grid item>
          <TextField
            className={failedAttempt ? incorrectPinInput : verifyCardPinInput}
            data-testid='verifyCardPinInput1'
            error={failedAttempt}
            id=''
            inputProps={{ maxLength: 1, min: 0, style: { textAlign: 'center' } }}
            inputRef={inputRef1}
            label=''
            name='verifyCardPinInput1'
            onChange={(e) => {
              if (Number.isInteger(parseInt(e.target.value, 10))) {
                setFailedAttempt(false);
                setInputOne(e.target.value);
                inputRef2?.current?.focus();
              } else {
                setInputOne('');
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && failedAttempt) {
                setFailedAttempt(false);
              }
            }}
            value={inputOne}
            variant='outlined'
          />
        </Grid>
        <Grid item>
          <TextField
            className={failedAttempt ? incorrectPinInput : verifyCardPinInput}
            data-testid='verifyCardPinInput2'
            error={failedAttempt}
            id=''
            inputProps={{ maxLength: 1, min: 0, style: { textAlign: 'center' } }}
            inputRef={inputRef2}
            label=''
            name='verifyCardPinInput2'
            onChange={(e) => {
              if (Number.isInteger(parseInt(e.target.value, 10))) {
                setFailedAttempt(false);
                setInputTwo(e.target.value);
                inputRef3?.current?.focus();
              } else {
                setInputTwo('');
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace') {
                if (inputTwo === '') {
                  inputRef1?.current?.focus();
                }
                if (failedAttempt) {
                  setFailedAttempt(false);
                }
              }
            }}
            value={inputTwo}
            variant='outlined'
          />
        </Grid>
        <Grid item>
          <TextField
            className={failedAttempt ? incorrectPinInput : verifyCardPinInput}
            data-testid='verifyCardPinInput3'
            error={failedAttempt}
            id=''
            inputProps={{ maxLength: 1, min: 0, style: { textAlign: 'center' } }}
            inputRef={inputRef3}
            label=''
            name='verifyCardPinInput3'
            onChange={(e) => {
              if (Number.isInteger(parseInt(e.target.value, 10))) {
                setFailedAttempt(false);
                setInputThree(e.target.value);
                inputRef4?.current?.focus();
              } else {
                setInputThree('');
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace') {
                if (inputThree === '') {
                  inputRef2?.current?.focus();
                }
                if (failedAttempt) {
                  setFailedAttempt(false);
                }
              }
            }}
            value={inputThree}
            variant='outlined'
          />
        </Grid>
        <Grid item>
          <TextField
            className={failedAttempt ? incorrectPinInput : verifyCardPinInput}
            data-testid='verifyCardPinInput4'
            error={failedAttempt}
            id=''
            inputProps={{ maxLength: 1, min: 0, style: { textAlign: 'center' } }}
            inputRef={inputRef4}
            label=''
            name='verifyCardPinInput4'
            onChange={(e) => {
              if (Number.isInteger(parseInt(e.target.value, 10))) {
                setInputFour(e.target.value);
                setFailedAttempt(false);
              } else {
                setInputFour('');
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace') {
                if (inputFour === '') {
                  inputRef3?.current?.focus();
                }
                if (e.key === 'Backspace' && failedAttempt) {
                  setFailedAttempt(false);
                }
              }
            }}
            value={inputFour}
            variant='outlined'
          />
        </Grid>
      </Grid>
      {failedAttempt ? incorrectPinState : null}
      <span
        className={`text-body-medium ${verifyCardModalText}`}
        data-testid='verifyCardModalHelpText'>
        {translateBillingHTML('Description.VerifyCardHelpLink', [
          {
            closing: 'linkEnd',
            content: (chunks) => (
              <Link data-testid='verifyCardModalHelpLink' href={Routes.HOME}>
                {chunks}
              </Link>
            ),
            opening: 'linkStart',
          },
        ])}
      </span>
      <Divider data-testid='secondDivider' />
      <div className={buttonContainer} data-testid='buttonContainer'>
        <Button
          data-testid='verifyButton'
          isDisabled={checkInputs()}
          onClick={verifyPinCode}
          size='Medium'
          variant='Emphasis'>
          {translateMisc('Action.Verify')}
        </Button>
        <Button
          className={skipButton}
          data-testid='skipButton'
          onClick={routeResult}
          size='Medium'
          variant='Standard'>
          {translateBilling('Action.Skip')}
        </Button>
      </div>
    </DialogContent>
  );

  let body: ReactElement;
  if (isVerifyLoading) {
    body = verifyLoadingState;
  } else if (isResendLoading) {
    body = resendLoadingState;
  } else if (resendCode) {
    body = resendPinState;
  } else {
    body = pinInputState;
  }

  return <UIThemeProvider>{body}</UIThemeProvider>;
};

export const openCardVerificationDialog = (params: {
  onDismiss?: () => void;
  paymentProfileId: string | null;
}): void => {
  openDialog({ component: CardVerificationDialog, props: params });
};

export default CardVerificationDialog;
