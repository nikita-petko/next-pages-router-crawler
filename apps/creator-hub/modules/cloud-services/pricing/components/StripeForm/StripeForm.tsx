import { PaymentElement, AddressElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { FunctionComponent } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography, Divider, Button, CircularProgress } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { useGetStripeConfirmation } from '@modules/react-query/serviceEfficiency';
import type { StripeAddress } from '../../types';
import { CardVerificationResultEnum } from '../shared/stripeConstants';
import useStripeFormStyles from './StripeForm.styles';

export interface StripeFormProps {
  setAsDefault: boolean;
  step: number;
  confirmAddressAndCard: (name: string, address: StripeAddress) => void;
  handleCloseDialog: () => void;
  onStripeConfirmResponse: (stripeResponse: CardVerificationResultEnum) => void;
}

const StripeForm: FunctionComponent<StripeFormProps> = ({
  step,
  setAsDefault,
  confirmAddressAndCard,
  handleCloseDialog,
  onStripeConfirmResponse,
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [saveDisabled, setSaveDisabled] = useState(true);
  const [paymentInfoComplete, setPaymentInfoComplete] = useState(false);
  const [addressInfoComplete, setAddressInfoComplete] = useState(false);
  const { translate } = useTranslationWrapper(useTranslation());

  const {
    classes: {
      circularSpace,
      stripeFormHeader,
      billingAddressFormHeader,
      bottomDivider,
      cancelButton,
      buttonContainer,
      accountAuthContainer,
      accountAuthRequired,
      accountAuthDescription,
      saveButton,
    },
  } = useStripeFormStyles();

  useEffect(() => {
    const paymentElement = elements?.getElement('payment');
    const addressElement = elements?.getElement('address');
    paymentElement?.on('change', (event) => {
      setPaymentInfoComplete(event.complete);
    });
    addressElement?.on('change', (event) => {
      setAddressInfoComplete(event.complete);
    });
    setSaveDisabled(!paymentInfoComplete || !addressInfoComplete);
    setIsProcessing(false);
  }, [elements, paymentInfoComplete, addressInfoComplete]);

  const { mutateAsync: confirmStripeSetup } = useGetStripeConfirmation(stripe, elements);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type is unknown
  const onSubmit = async (e: any) => {
    e.preventDefault();
    setIsProcessing(true);

    if (!stripe || !elements) {
      return null;
    }

    function delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    try {
      const stripeConfirmResponse = await confirmStripeSetup();
      await delay(1000); // give some time for Stripe to process
      if (!stripeConfirmResponse || stripeConfirmResponse === null || stripeConfirmResponse.error) {
        setIsProcessing(false);
        onStripeConfirmResponse(CardVerificationResultEnum.UNKNOWN_ERROR);
      } else if (stripeConfirmResponse.setupIntent && !stripeConfirmResponse.error) {
        const addressElement = elements?.getElement('address');
        addressElement?.getValue().then(async function handleAddressResult(result) {
          if (result.complete) {
            await delay(500);
            confirmAddressAndCard(result.value.name, result.value.address);
          }
        });
        setIsProcessing(false);
        onStripeConfirmResponse(CardVerificationResultEnum.SUCCESS);
        await delay(500);
      }
      return null;
    } catch {
      setIsProcessing(false);
      onStripeConfirmResponse(CardVerificationResultEnum.UNKNOWN_ERROR);
      handleCloseDialog();
      return null;
    }
  };

  const stripeFormState = (
    <form data-testid='stripeForm' name='stripeForm'>
      <Typography data-testid='stripeFormHeader' className={stripeFormHeader} variant='h6'>
        {translate(translationKey('Label.CreditOrDebitCard', TranslationNamespace.CloudServices))}
      </Typography>
      <PaymentElement />
      <Typography
        data-testid='billingAddressFormHeader'
        className={billingAddressFormHeader}
        variant='h6'>
        {translate(translationKey('Label.BillingAddress', TranslationNamespace.CloudServices))}
      </Typography>
      <AddressElement
        options={{
          mode: 'billing',
          defaultValues: {
            address: {
              state: 'CA',
              country: 'US',
            },
          },
        }}
      />
      {setAsDefault && (
        <div className={accountAuthContainer}>
          <Typography variant='captionHeader' color='secondary' className={accountAuthRequired}>
            {translate(
              translationKey('Label.AccountAuthRequired', TranslationNamespace.CloudServices),
            )}
          </Typography>
          <Typography variant='captionBody' className={accountAuthDescription}>
            {translate(
              translationKey(
                'Description.CardHolderReminderText',
                TranslationNamespace.CloudServices,
              ),
            )}
          </Typography>
        </div>
      )}
      <Divider data-testid='bottomDivider' className={bottomDivider} />
      <Grid
        container
        XSmall={12}
        justifyContent='flex-end'
        data-testid='buttonContainer'
        className={buttonContainer}>
        <Button
          data-testid='cancelButton'
          variant='contained'
          color='secondary'
          onClick={handleCloseDialog}
          className={cancelButton}>
          {translate(
            translationKey(
              step === 1 ? 'Label.Back' : 'Label.Cancel',
              TranslationNamespace.CloudServices,
            ),
          )}
        </Button>
        <Button
          data-testid='saveButton'
          onClick={(e) => onSubmit(e)}
          variant='contained'
          disabled={saveDisabled}
          className={saveButton}>
          {!isProcessing ? (
            translate(
              translationKey(
                step === 1 ? 'Label.NextStepper' : 'Label.SaveAndAuthenticate',
                TranslationNamespace.CloudServices,
              ),
            )
          ) : (
            <div>
              <CircularProgress size='15px' color='secondary' className={circularSpace} />
              <span>
                {step === 1
                  ? translate(
                      translationKey('Label.NextStepper', TranslationNamespace.CloudServices),
                    )
                  : translate(
                      translationKey(
                        'Label.SaveAndAuthenticate',
                        TranslationNamespace.CloudServices,
                      ),
                    )}
              </span>
            </div>
          )}
        </Button>
      </Grid>
    </form>
  );

  return stripeFormState;
};

export default withTranslation(StripeForm, [TranslationNamespace.CloudServices]);
