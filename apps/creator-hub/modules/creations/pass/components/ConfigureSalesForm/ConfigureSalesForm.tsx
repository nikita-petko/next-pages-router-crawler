import { useCallback, useEffect, useState } from 'react';
import NextLink from 'next/link';
import type { SubmitHandler } from 'react-hook-form';
import { useForm, Controller, FormProvider, useFormContext } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import {
  Switch,
  Button,
  FormHelperText,
  ErrorOutlineOutlinedIcon,
  FormControlLabel,
  StickyFooter,
} from '@rbx/ui';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { ControllerCheckboxWithTooltip } from '@modules/monetization-shared/form/ControllerCheckboxWithTooltip';
import { Link } from '@modules/monetization-shared/link';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import { useUpdateGamePass } from '@modules/passes/queries/useUpdateGamePass';
import DisallowPriceChangeInExperimentBanner from '@modules/price-optimization/components/DisallowPriceChangeInExperimentBanner';
import NewRegionalPricingBanner from '@modules/regional-pricing/components/NewRegionalPricingBanner';
import RegionalPricingDisclaimerModal, {
  useRegionalPricingDisclaimer,
} from '@modules/regional-pricing/components/RegionalPricingDisclaimerModal/RegionalPricingDisclaimerModal';
import { withSalesLimitReachedDialog } from '../../dialogs/SalesLimitReachedDialog';
import RegionalPricesDisplay from '../form-shared/RegionalPricesDisplay';
import type { ConfigureSalesFormValues } from '../form-shared/types';
import { PriceTextField } from './ConfigureSalesFields';

type Props = {
  universeId: number;
  passId: number;
  isForSale: boolean;
  price?: number | null;
  isRegionalPricingEnabled?: boolean;
  isInActivePriceOptimizationExperiment?: boolean;
  isPending?: boolean;
  shopId?: number;
};

const getPassesUrl = dashboard.getMonetizationPassesUrl;
const getPriceCheckLink = dashboard.getMonetizationDynamicPriceCheckUrl;

const ConfigureSalesForm = ({
  universeId,
  passId,
  isForSale,
  price,
  isInActivePriceOptimizationExperiment = false,
  isPending,
  shopId,
}: Props) => {
  const { translate, translateHTML } = useTranslation();

  const {
    register,
    reset,
    control,
    formState: { isValid, isDirty, isSubmitting },
    setValue,
    watch,
    trigger,
    handleSubmit,
    getValues,
  } = useFormContext<ConfigureSalesFormValues>();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const spyIsForSale = watch('isForSale');

  const passesLink = getPassesUrl(universeId);

  const { mutateAsync: updateGamePass, isPending: isUpdateGamePassPending } = useUpdateGamePass({
    universeId,
    gamePassId: passId,
    shopId,
  });

  const saveChanges: SubmitHandler<ConfigureSalesFormValues> = useCallback(async () => {
    setErrorMessage('');
    // Note: we use getValues() instead of submit data as submit data does not include disabled fields
    // Only use submit data to trigger final state validation e.g., disclaimers
    const values = getValues();

    try {
      await updateGamePass({
        isForSale: values.isForSale,
        price: values.price,
        isRegionalPricingEnabled: values.isRegionalPricingEnabled,
      });

      toast({ title: translate('Message.PassConfigureSuccess') });
      reset(values);
    } catch {
      setErrorMessage(translate('Error.PassConfigureGeneralError'));
    }
  }, [getValues, updateGamePass, reset, translate]);

  const { withDisclaimer: withRegionalPricingDisclaimer } =
    useRegionalPricingDisclaimer(universeId);

  const initiateSaveChanges: SubmitHandler<ConfigureSalesFormValues> = useCallback(
    async (data) => {
      await withRegionalPricingDisclaimer(() => saveChanges(data), {
        enabled: !!data.isRegionalPricingEnabled,
      });
    },
    [saveChanges, withRegionalPricingDisclaimer],
  );

  const handleToggleForSale = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;

      setValue('isForSale', isChecked, { shouldDirty: true });

      if (isChecked) {
        if (!isForSale) {
          await withSalesLimitReachedDialog({
            universeId,
            onCancel: () => reset(),
            onError: () => setErrorMessage(translate('Error.PassConfigureGeneralError')),
          });
        }

        setValue('price', price ?? null, { shouldDirty: true });
      }
      await trigger('price');
    },
    [setValue, trigger, universeId, price, isForSale, translate, reset],
  );

  // Note: we only need to revalidate price, as the other fields don't have cross-field validation
  const revalidatePrice = useCallback(() => {
    void trigger('price');
  }, [trigger]);

  const isSubmitDisabled = isInActivePriceOptimizationExperiment || !isDirty || !isValid;

  return (
    <form className='flex flex-col' onSubmit={handleSubmit(initiateSaveChanges)}>
      <NewRegionalPricingBanner
        universeId={universeId}
        type='gamepass'
        enabled={!isInActivePriceOptimizationExperiment}
      />

      <DisallowPriceChangeInExperimentBanner enabled={isInActivePriceOptimizationExperiment} />

      <div className='flex flex-col max-width-[678px] margin-top-medium'>
        <span className='text-title-large padding-bottom-small'>{translate('Heading.Price')}</span>

        <Controller
          name='isForSale'
          control={control}
          render={({ field }) => (
            <FormControlLabel
              className='width-fit padding-bottom-large'
              label={translate('Label.ItemForSale')}
              control={
                <Switch
                  {...field}
                  checked={field.value ?? undefined}
                  aria-label={translate('Label.ItemForSale')}
                  onChange={handleToggleForSale}
                  disabled={isInActivePriceOptimizationExperiment}
                />
              }
            />
          )}
        />

        <PriceTextField
          register={register}
          helperText={
            isInActivePriceOptimizationExperiment
              ? translate('Message.DisallowPriceChangeInExperimentHelper')
              : undefined
          }
          universeId={universeId}
          label={translate('Label.DefaultPrice')}
          disabled={!spyIsForSale || isInActivePriceOptimizationExperiment}
        />
      </div>

      <div className='flex flex-col padding-top-large padding-x-medium margin-bottom-medium'>
        <ControllerCheckboxWithTooltip
          name='isRegionalPricingEnabled'
          control={control}
          onChange={revalidatePrice}
          label={translate('Label.EnableRegionalPricing')}
          tooltip={translate('Tooltip.EnableRegionalPricingDetailed')}
          disabled={!spyIsForSale || isInActivePriceOptimizationExperiment}
        />

        <div className='flex items-center gap-[11px] no-wrap'>
          <ErrorOutlineOutlinedIcon color='warning' />

          <span className='text-body-medium'>
            {translateHTML('Description.RequiresDynamicPrices', [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content: (chunks) => (
                  <Link
                    underline='always'
                    className='content-inherit'
                    href={getPriceCheckLink(universeId)}>
                    {chunks}
                  </Link>
                ),
              },
            ])}
          </span>
        </div>
      </div>

      <RegionalPricesDisplay
        universeId={universeId}
        control={control}
        className='margin-bottom-medium'
      />

      <div className='flex flex-col-reverse gap-medium padding-y-small medium:flex-row'>
        <Button
          variant='outlined'
          color='primary'
          size='large'
          component={NextLink}
          href={passesLink}
          disabled={isSubmitting}>
          {translate('Action.Cancel')}
        </Button>
        <Button
          type='submit'
          variant='contained'
          size='large'
          disabled={isSubmitDisabled || !!isPending || isUpdateGamePassPending}
          loading={isSubmitting || !!isPending || isUpdateGamePassPending}>
          {translate('Action.ConfigurePass')}
        </Button>
      </div>

      <StickyFooter
        // Remove default padding for consistency with buttons
        classes={{ root: 'padding-x-none' }}
        primary={{
          type: 'submit',
          variant: 'contained',
          size: 'large',
          disabled: isSubmitDisabled || !!isPending || isUpdateGamePassPending,
          loading: isSubmitting || !!isPending || isUpdateGamePassPending,
          label: translate('Action.ConfigurePass'),
        }}
        secondary={{
          type: 'button',
          variant: 'outlined',
          color: 'primary',
          size: 'large',
          component: NextLink,
          disabled: isSubmitting || !!isPending || isUpdateGamePassPending,
          label: translate('Action.Cancel'),
          href: passesLink,
        }}
      />

      {errorMessage && (
        <FormHelperText error className='text-caption-medium content-system-alert padding-x-small'>
          {errorMessage}
        </FormHelperText>
      )}
    </form>
  );
};

function ConfigureSalesFormContainer(props: Props) {
  const { isForSale, price, isRegionalPricingEnabled, universeId } = props;

  const methods = useForm<ConfigureSalesFormValues>({
    mode: 'onChange',
    defaultValues: {
      isForSale,
      price: price ?? null,
      isRegionalPricingEnabled: isRegionalPricingEnabled ?? false,
    },
  });

  const { reset } = methods;
  useEffect(() => {
    reset({
      isForSale,
      price: price ?? null,
      isRegionalPricingEnabled: isRegionalPricingEnabled ?? false,
    });
  }, [isForSale, price, isRegionalPricingEnabled, reset]);

  return (
    <FormProvider {...methods}>
      <ConfigureSalesForm {...props} universeId={universeId} />

      <RegionalPricingDisclaimerModal universeId={universeId} />
    </FormProvider>
  );
}

export default ConfigureSalesFormContainer;
