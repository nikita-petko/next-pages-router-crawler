import { useCallback, useEffect, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm, FormProvider, useFormContext, Controller } from 'react-hook-form';
import { Button, clsx, Toggle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { withManagedPricingSubmitGuard } from '@modules/managed-pricing/dialogs/withManagedPricingSubmitGuard';
import type { ManagedPricingOnboardingStatus } from '@modules/managed-pricing/types';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { ButtonLink } from '@modules/monetization-shared/button-link';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import { useUpdateGamePass } from '@modules/passes/queries/useUpdateGamePass';
import DisallowPriceChangeInExperimentBanner from '@modules/price-optimization/components/DisallowPriceChangeInExperimentBanner';
import { withSalesLimitReachedDialog } from '../../dialogs/SalesLimitReachedDialog';
import RegionalPricesDisplay from '../form-shared/RegionalPricesDisplay';
import type { ConfigureSalesFormValues } from '../form-shared/types';
import { PriceTextInput } from './ConfigureSalesFields';

type Props = {
  universeId: number;
  passId: number;
  isForSale: boolean;
  price?: number | null;
  isManagedPricingEnabled?: boolean;
  isInActivePriceOptimizationExperiment?: boolean;
  managedPricingOnboardingStatus: ManagedPricingOnboardingStatus | undefined;
  isPending?: boolean;
  shopId?: number;
};

const getPassesUrl = dashboard.getMonetizationPassesUrl;

const ConfigureSalesForm = ({
  universeId,
  passId,
  isForSale,
  isManagedPricingEnabled,
  isInActivePriceOptimizationExperiment = false,
  managedPricingOnboardingStatus,
  isPending,
  shopId,
}: Props) => {
  const { translate } = useTranslation();

  const {
    register,
    reset,
    resetField,
    control,
    formState: { isValid, isDirty, isSubmitting },
    setValue,
    watch,
    trigger,
    handleSubmit,
    getValues,
  } = useFormContext<ConfigureSalesFormValues>();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Use `useWatch` so that toggling `isForSale` re-renders dependent disabling/dimming logic.
  const currentIsForSale = watch('isForSale');

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
        // NOTE(@jeminpark): we are temporarily using isRegionalPricingEnabled to match the old form such
        // that components are reused. This should be changed to isManagedPricingEnabled in the future.
        isManagedPricingEnabled: values.isRegionalPricingEnabled,
      });

      reset(values);

      toast({ title: translate('Message.PassConfigureSuccess') });
    } catch {
      setErrorMessage(translate('Error.PassConfigureGeneralError'));
    }
  }, [getValues, updateGamePass, reset, translate]);

  const initiateSaveChanges: SubmitHandler<ConfigureSalesFormValues> = useCallback(
    async (data) => {
      await withManagedPricingSubmitGuard({
        universeId,
        currentStatus: isManagedPricingEnabled,
        // NOTE(@jeminpark): we are temporarily using isRegionalPricingEnabled to match the old form such
        // that components are reused. This should be changed to isManagedPricingEnabled in the future.
        targetStatus: data.isRegionalPricingEnabled ?? undefined,
        onboardingStatus: managedPricingOnboardingStatus,
        onConfirm: () => void saveChanges(data),
      });
    },
    [saveChanges, isManagedPricingEnabled, universeId, managedPricingOnboardingStatus],
  );

  // Note: we only need to revalidate price, as the other fields don't have cross-field validation
  const revalidatePrice = useCallback(() => {
    void trigger('price');
  }, [trigger]);

  const handleToggleForSale = useCallback(
    async (isChecked: boolean) => {
      // Note: validation should happen after setting isForSale against price so that the price requirement is surfaced
      setValue('isForSale', isChecked, { shouldDirty: true });
      revalidatePrice();

      if (isChecked && !isForSale) {
        await withSalesLimitReachedDialog({
          universeId,
          onCancel: () => {
            resetField('isForSale');
            revalidatePrice();
          },
          onError: () => setErrorMessage(translate('Error.PassConfigureGeneralError')),
        });
      }
    },
    [setValue, universeId, isForSale, translate, resetField, revalidatePrice],
  );

  const isSubmitDisabled = isInActivePriceOptimizationExperiment || !isDirty || !isValid;
  const isAllPending = isSubmitting || !!isPending || isUpdateGamePassPending;

  return (
    <form
      className='flex flex-col padding-top-small gap-xxlarge'
      onSubmit={handleSubmit(initiateSaveChanges)}>
      <DisallowPriceChangeInExperimentBanner enabled={isInActivePriceOptimizationExperiment} />

      <div className='flex flex-col gap-large max-width-[678px]'>
        <div className='flex justify-between items-center'>
          <label htmlFor='price' className='text-title-large'>
            {translate('Label.Price')}
            {/* This is a "Fake" required asterisk since we need the toggle aligned with the label */}
            {currentIsForSale && <span className='content-default'> *</span>}
          </label>
          <Controller
            name='isForSale'
            control={control}
            render={({ field }) => (
              <Toggle
                label={translate('Label.ItemForSale')}
                size='Medium'
                placement='Start'
                ref={field.ref}
                name={field.name}
                isChecked={field.value ?? undefined}
                // Intentionally overriding default checked behavior to handle sales limit status
                onCheckedChange={handleToggleForSale}
                onBlur={field.onBlur}
                isDisabled={(field.disabled ?? false) || isInActivePriceOptimizationExperiment}
              />
            )}
          />
        </div>

        <PriceTextInput
          id='price'
          control={control}
          error={
            isInActivePriceOptimizationExperiment
              ? translate('Message.DisallowPriceChangeInExperimentHelper')
              : undefined
          }
          register={register}
          universeId={universeId}
          disabled={!currentIsForSale || isInActivePriceOptimizationExperiment}
        />
      </div>

      <div className='flex flex-col gap-large max-width-[678px]'>
        <div className='flex justify-between items-center'>
          <span className={clsx('text-title-large', !currentIsForSale && 'opacity-[0.5]')}>
            {translate('Label.ManagedPricing')}
          </span>
          <Controller
            name='isRegionalPricingEnabled'
            control={control}
            render={({ field }) => (
              <Toggle
                label={translate('Label.Enabled')}
                size='Medium'
                placement='Start'
                ref={field.ref}
                name={field.name}
                isChecked={field.value ?? undefined}
                onCheckedChange={(isChecked) => field.onChange(isChecked)}
                onChange={revalidatePrice}
                onBlur={field.onBlur}
                isDisabled={
                  (field.disabled ?? false) ||
                  !currentIsForSale ||
                  isInActivePriceOptimizationExperiment
                }
              />
            )}
          />
        </div>
        <RegionalPricesDisplay universeId={universeId} control={control} shouldUnmount={false} />
      </div>

      <div className='flex flex-col-reverse gap-medium medium:flex-row'>
        <ButtonLink
          variant='Standard'
          size='Large'
          className='padding-x-xlarge'
          href={passesLink}
          isDisabled={isSubmitting}>
          {translate('Action.Cancel')}
        </ButtonLink>
        <Button
          type='submit'
          variant='Emphasis'
          size='Large'
          className='padding-x-xlarge'
          isDisabled={isSubmitDisabled || isAllPending}
          isLoading={isAllPending}>
          {translate('Action.ConfigurePass')}
        </Button>
      </div>

      {errorMessage && (
        <span
          aria-live='assertive'
          className='text-caption-medium content-system-alert padding-x-small'>
          {errorMessage}
        </span>
      )}
    </form>
  );
};

function ConfigurePassSalesFormContainer(props: Props) {
  const { isForSale, price, isManagedPricingEnabled, universeId } = props;

  const methods = useForm<ConfigureSalesFormValues>({
    mode: 'onChange',
    defaultValues: {
      isForSale,
      price: price ?? null,
      // NOTE(@jeminpark): we are temporarily using isRegionalPricingEnabled to match the old form such
      // that components are reused. This should be changed to isManagedPricingEnabled in the future.
      isRegionalPricingEnabled: isManagedPricingEnabled ?? null,
    },
  });

  const { reset } = methods;
  useEffect(() => {
    reset({
      isForSale,
      price: price ?? null,
      // NOTE(@jeminpark): we are temporarily using isRegionalPricingEnabled to match the old form such
      // that components are reused. This should be changed to isManagedPricingEnabled in the future.
      isRegionalPricingEnabled: isManagedPricingEnabled ?? false,
    });
  }, [isForSale, price, isManagedPricingEnabled, reset]);

  return (
    <FormProvider {...methods}>
      <ConfigureSalesForm {...props} universeId={universeId} />
    </FormProvider>
  );
}

export default ConfigurePassSalesFormContainer;
