import { Elements } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  Grid,
  Typography,
  useTheme,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { useGetStripeElements } from '@modules/react-query/serviceEfficiency';
import { useCloudPricingClient } from '../../CloudPricingClientProvider';
import type { StripeAddress } from '../../types';
import {
  getStripePublicAPIKeyForEnv,
  getThemedStripeOptions,
  CardVerificationResultEnum,
} from '../shared/stripeConstants';
import StripeForm from '../StripeForm/StripeForm';
import useStripeElementsProviderStyles from './StripeElementsProvider.styles';

export interface StripeElementsProviderProps {
  creatorId: number;
  setAsDefault: boolean;
  enableDialog: boolean;
  step: number;
  closeDialog: () => void;
  confirmAddressAndCard: (name: string, address: StripeAddress) => void;
  handleStripeResponse: (stripeResponse: CardVerificationResultEnum, setDefault: boolean) => void;
}

const StripeElementsProvider: FunctionComponent<StripeElementsProviderProps> = ({
  creatorId,
  step,
  enableDialog,
  setAsDefault,
  closeDialog,
  confirmAddressAndCard,
  handleStripeResponse,
}) => {
  const [stripePromise, setStripePromise] = useState<Stripe | null>(null);
  const [clientSecretKey, setClientSecretKey] = useState('');
  const cloudPricingClient = useCloudPricingClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const theme = useTheme();
  const { translate } = useTranslationWrapper(useTranslation());

  const {
    classes: { dividerTop, addPaymentMethodDescription },
  } = useStripeElementsProviderStyles();

  const handleClose = () => {
    closeDialog();
  };

  const handleStripeFormResponse = useCallback(
    (stripeResponse: CardVerificationResultEnum) => {
      handleStripeResponse(stripeResponse, true);
    },
    [handleStripeResponse],
  );

  const { mutateAsync: loadStripe } = useGetStripeElements(getStripePublicAPIKeyForEnv());

  const fetchStripePromise = useCallback(async () => {
    try {
      const response = await loadStripe();
      setStripePromise(response);
    } catch {
      handleStripeFormResponse(CardVerificationResultEnum.UNKNOWN_ERROR);
      closeDialog();
    }
  }, [loadStripe, closeDialog, handleStripeFormResponse]);

  const getClientSecret = useCallback(async () => {
    try {
      const res = await cloudPricingClient.createUserPaymentProfile(creatorId);
      setClientSecretKey(res.clientSecret);
    } catch {
      handleStripeFormResponse(CardVerificationResultEnum.UNKNOWN_ERROR);
      closeDialog();
    }
  }, [cloudPricingClient, creatorId, closeDialog, handleStripeFormResponse]);

  // Get Stripe promise and client_secret to render Stripe form
  useEffect(() => {
    fetchStripePromise();
    getClientSecret();
    setIsDialogOpen(true);
  }, [fetchStripePromise, getClientSecret]);

  const options = {
    clientSecret: clientSecretKey,
    ...getThemedStripeOptions(theme),
  };

  let stripeForm = null;

  if (stripePromise && clientSecretKey) {
    stripeForm = (
      <Elements stripe={stripePromise} options={options}>
        <StripeForm
          step={step}
          confirmAddressAndCard={confirmAddressAndCard}
          handleCloseDialog={handleClose}
          setAsDefault={setAsDefault}
          onStripeConfirmResponse={handleStripeFormResponse}
        />
      </Elements>
    );
  }

  if (enableDialog && stripePromise && clientSecretKey) {
    return (
      <Dialog open={isDialogOpen} scroll='body' onClose={handleClose}>
        <DialogContent>
          <Typography variant='h5'>
            {translate(
              translationKey('Label.AddPaymentInformation', TranslationNamespace.CloudServices),
            )}
          </Typography>
          <Divider className={dividerTop} />
          <Typography variant='body2' color='secondary' className={addPaymentMethodDescription}>
            {translate(
              translationKey('Description.AddPaymentMethod', TranslationNamespace.CloudServices),
            )}
          </Typography>
          {stripeForm}
        </DialogContent>
      </Dialog>
    );
  }

  if (!enableDialog && stripePromise && clientSecretKey) {
    return stripeForm;
  }

  // When loading, show a spinner
  if (!enableDialog) {
    return (
      <Grid display='flex' justifyContent='center' alignItems='center'>
        <CircularProgress />
      </Grid>
    );
  }

  return (
    <Dialog open>
      <DialogContent>
        <CircularProgress />
      </DialogContent>
    </Dialog>
  );
};

export default withTranslation(StripeElementsProvider, [TranslationNamespace.CloudServices]);
