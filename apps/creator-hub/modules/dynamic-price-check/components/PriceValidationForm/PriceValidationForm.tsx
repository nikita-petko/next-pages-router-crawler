import { useCallback } from 'react';
import NextLink from 'next/link';
import { FormProvider, useForm, useFormState } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { Typography, Divider, Button } from '@rbx/ui';
import usersClient from '@modules/clients/users';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { openGeneralErrorDialog } from '../../dialogs/GeneralErrorDialog';
import { openTooManyOnSaleErrorDialog } from '../../dialogs/TooManyOnSaleErrorDialog';
import { useSetUniversePinnedLocation } from '../../queries/useSetUniversePinnedLocation';
import { useSetUniversePinnedPrice } from '../../queries/useSetUniversePinnedPrice';
import { isPollingStatus } from '../../utils/priceValidationStatusUtils';
import PriceValidationLoadingModal from '../PriceValidationLoadingModal/PriceValidationLoadingModal';
import AccountsSelection from './AccountsSelection';
import usePriceValidationFormStyles from './PriceValidationForm.styles';
import TestConfigurationSelection from './TestConfigurationSelection/TestConfigurationSelection';
import type {
  PriceConfigurationErrorResponse,
  PriceValidationFormValues,
  TestingType,
  Country,
  UniversePinningStatus,
} from './types';

interface PriceValidationFormProps {
  universeId: number;
  initialUserIds: number[];
  initialStatus: UniversePinningStatus;
  initialTestingType: TestingType | null;
  initialPinnedPrice: number | null;
  initialPinnedLocation: Country | null;
  showReturnToPriceOptimization: boolean;
  /** Whether inputs AND form submission should be disabled */
  disabled?: boolean;
}

const getPriceOptimizationLink = dashboard.getMonetizationPriceOptimizationUrl;

/** Separating out submit button to granularly handle formstate */
const SubmitButton = ({
  initialStatus,
  disabled,
}: {
  initialStatus: UniversePinningStatus;
  disabled?: boolean;
}) => {
  const { translate } = useTranslation();
  const { isValid, isSubmitting } = useFormState<PriceValidationFormValues>();

  const showDisable = initialStatus === 'Enabled' || initialStatus === 'Disabling';

  return (
    <Button
      type='submit'
      size='large'
      variant='contained'
      color={showDisable ? 'primary' : 'primaryBrand'}
      disabled={!!disabled || !isValid || isSubmitting}
      loading={isPollingStatus(initialStatus)}>
      {showDisable ? translate('Action.Disable') : translate('Action.Enable')}
    </Button>
  );
};

const PriceValidationForm = ({
  universeId,
  initialUserIds,
  initialStatus,
  initialTestingType,
  initialPinnedPrice,
  initialPinnedLocation,
  disabled,
  showReturnToPriceOptimization,
}: PriceValidationFormProps) => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = usePriceValidationFormStyles();

  const methods = useForm<PriceValidationFormValues>({
    defaultValues: async () => ({
      users: (await usersClient.getUsersByIds(initialUserIds)).data ?? [],
      testing: initialTestingType,
      price: initialPinnedPrice ?? null,
      location: initialPinnedLocation ?? null,
    }),
    mode: 'onChange',
    disabled,
  });

  const handleTooManyOnSaleProductsError = useCallback((error: PriceConfigurationErrorResponse) => {
    if (error?.errorCode === 'TooManyOnSaleProducts') {
      openTooManyOnSaleErrorDialog();
      return true;
    }
    return false;
  }, []);

  const { setUniversePinnedPrice } = useSetUniversePinnedPrice(universeId, {
    onErrorResponse: handleTooManyOnSaleProductsError,
    onError: () => openGeneralErrorDialog(),
  });

  const { setUniversePinnedLocation } = useSetUniversePinnedLocation(universeId, {
    onErrorResponse: handleTooManyOnSaleProductsError,
    onError: () => openGeneralErrorDialog(),
  });

  const isValidationEnabled = initialStatus === 'Enabled';
  const isValidationLoading = isPollingStatus(initialStatus);
  const isEnabling = initialStatus === 'Enabling';

  /** Note: we handle input disables separately for disabling requests */
  const isFormInputsDisabled = !!disabled || isValidationEnabled;

  const submitValidationConfig = useCallback(
    async (values: PriceValidationFormValues) => {
      const targetStatus = isValidationEnabled ? 'Disabling' : 'Enabling';
      const userIds = values.users.map((user) => user.id).filter((id) => id !== undefined);

      /* istanbul ignore if -- Validated via schema, but to allow type inference */
      if (values.testing === null) {
        return;
      }

      switch (values.testing) {
        case 'price': {
          await setUniversePinnedPrice({
            userIds,
            // oxlint-disable-next-line typescript/no-non-null-assertion -- validated via schema
            price: values.price!,
            targetStatus,
          }).catch(() => {}); // noop: errors handled by `useMutation:onError`
          break;
        }
        case 'location': {
          await setUniversePinnedLocation({
            userIds,
            countryIso2Code: values.location?.code ?? null,
            targetStatus,
          }).catch(() => {}); // noop: errors handled by `useMutation:onError`
          break;
        }
      }
    },
    [isValidationEnabled, setUniversePinnedPrice, setUniversePinnedLocation],
  );

  return (
    <FormProvider {...methods}>
      <form
        className={classes.formElements}
        onSubmit={methods.handleSubmit(submitValidationConfig)}>
        <section className={classes.numberedFormElement}>
          <Typography variant='h5' component='h3'>
            {translate('Heading.AddAccounts')}
          </Typography>
          <Typography variant='body1' component='p'>
            {translate('Description.AddAccounts')}
          </Typography>

          <AccountsSelection disabled={isFormInputsDisabled} />
        </section>

        <section className={classes.numberedFormElement}>
          <Typography variant='h5' component='h3'>
            {translate('Heading.ChooseTestingType')}
          </Typography>
          <Typography variant='body1' component='p'>
            {translate('Description.ChooseTestingType')}
          </Typography>

          <TestConfigurationSelection disabled={isFormInputsDisabled} />
        </section>

        <section className={classes.numberedFormElement}>
          <Typography variant='h5' component='h3'>
            {translate('Heading.TestExperience')}
          </Typography>
          <Typography variant='body1' component='p'>
            {translate('Description.TestExperience')}
          </Typography>

          <Typography variant='body1' component='span'>
            {translateHTML('Description.PurchaseBlockDisclaimer', [
              {
                opening: 'boldStart',
                closing: 'boldEnd',
                content: (chunks) => <strong>{chunks}</strong>,
              },
            ])}
          </Typography>
        </section>

        <Divider />

        <div className={classes.actionContainer}>
          <SubmitButton initialStatus={initialStatus} disabled={disabled} />

          {showReturnToPriceOptimization && (
            <Button
              size='large'
              variant='outlined'
              color='secondary'
              component={NextLink}
              href={getPriceOptimizationLink(universeId)}>
              {translate('Action.ReturnPriceOptimization')}
            </Button>
          )}
        </div>

        {isValidationLoading && <PriceValidationLoadingModal isEnabling={isEnabling} />}
      </form>
    </FormProvider>
  );
};

export default PriceValidationForm;
