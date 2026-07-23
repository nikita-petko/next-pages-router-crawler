import { useCallback } from 'react';
import NextLink from 'next/link';
import { FormProvider, useForm, useFormState } from 'react-hook-form';
import { Typography, Divider, Button, Link } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import type { UniverseFixedPriceStatus } from '@rbx/clients/priceConfigurationApi/v1';
import usersClient from '@modules/clients/users';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import { getSupportFormUrl } from '@modules/miscellaneous/common/urls/www';
import { isPollingStatus } from '../../utils/priceValidationStatusUtils';
import PriceValidationLoadingModal from '../PriceValidationLoadingModal/PriceValidationLoadingModal';
import useSetUniverseFixedPrice from '../../queries/useSetUniverseFixedPrice';
import useSetUniversePinnedLocation from '../../queries/useSetUniversePinnedLocation';
import { useOpenErrorDialog } from '../../context/ErrorDialogContext';
import usePriceValidationFormStyles from './PriceValidationForm.styles';
import AccountsSelection from './AccountsSelection';
import TestConfigurationSelection from './TestConfigurationSelection/TestConfigurationSelection';
import type {
  PriceConfigurationErrorResponse,
  PriceValidationFormValues,
  TestingType,
  Country,
  PriceValidationConfigStatus,
} from './types';

interface PriceValidationFormProps {
  universeId: number;
  initialUserIds: number[];
  initialStatus: PriceValidationConfigStatus;
  initialTestingType: TestingType | null;
  initialFixedPrice: number | null;
  initialPinnedLocation: Country | null;
  showReturnToPriceOptimization: boolean;
  /** Whether inputs AND form submission should be disabled */
  disabled?: boolean;
}

const getPriceOptimizationLink = dashboard.getMonetizationPriceOptimizationUrl;
const supportLink = getSupportFormUrl();

/** Separating out submit button to granularly handle formstate */
const SubmitButton = ({
  initialStatus,
  disabled,
}: {
  initialStatus: UniverseFixedPriceStatus;
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
      disabled={disabled || !isValid || isSubmitting}
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
  initialFixedPrice,
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
      price: initialFixedPrice ?? null,
      location: initialPinnedLocation ?? null,
    }),
    mode: 'onChange',
    disabled,
  });

  const openErrorDialog = useOpenErrorDialog();

  const handleTooManyOnSaleProductsError = useCallback(
    async (error: PriceConfigurationErrorResponse) => {
      if (error?.errorCode === 'TooManyOnSaleProducts') {
        openErrorDialog({
          title: translate('Heading.UnableToCompleteRequestError'),
          content: translateHTML('Message.TooManyOnSaleProductsError', [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content: (chunks) => (
                <Link href={supportLink} target='_blank'>
                  {chunks}
                </Link>
              ),
            },
          ]),
        });
        return true;
      }
      return false;
    },
    [openErrorDialog, translate, translateHTML],
  );

  const { setUniverseFixedPrice } = useSetUniverseFixedPrice(universeId, {
    onErrorResponse: handleTooManyOnSaleProductsError,
    onError: () => openErrorDialog(),
  });

  const { setUniversePinnedLocation } = useSetUniversePinnedLocation(universeId, {
    onErrorResponse: handleTooManyOnSaleProductsError,
    onError: () => openErrorDialog(),
  });

  const isValidationEnabled = initialStatus === 'Enabled';
  const isValidationLoading = isPollingStatus(initialStatus);
  const isEnabling = initialStatus === 'Enabling';

  /** Note: we handle input disables separately for disabling requests */
  const isFormInputsDisabled = disabled || isValidationEnabled;

  const submitValidationConfig = useCallback(
    async (values: PriceValidationFormValues) => {
      const targetStatus = isValidationEnabled ? 'Disabling' : 'Enabling';
      const userIds = values.users.map((user) => user.id).filter((id) => id !== undefined);

      // Validated via schema, but to allow type inference
      if (values.testing === null) {
        return;
      }

      switch (values.testing) {
        case 'price': {
          await setUniverseFixedPrice({
            userIds,
            fixedPrice: values.price!, // validated via schema
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
        // Should not occur without major breakage
        default: {
          const exhaustiveCheck: never = values.testing;
          throw new Error(`Unhandled testing type: ${exhaustiveCheck}`);
        }
      }
    },
    [isValidationEnabled, setUniverseFixedPrice, setUniversePinnedLocation],
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
