import { useCallback, useEffect, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { Controller, FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form';
import type { GiftingTradingStatus } from '@rbx/client-developer-products-api/v1';
import { Button, clsx, Toggle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import { useUpdateDeveloperProduct } from '@modules/developer-products/queries/useUpdateDeveloperProduct';
import { withManagedPricingSubmitGuard } from '@modules/managed-pricing/dialogs/withManagedPricingSubmitGuard';
import GiftingTradingWarningBannerV2 from '@modules/managed-pricing/gifting-trading/GiftingTradingWarningBannerV2';
import { shouldShowGiftingTradingReminder } from '@modules/managed-pricing/gifting-trading/utils';
import type { ManagedPricingOnboardingStatus } from '@modules/managed-pricing/types';
import { DEVELOPER_PRODUCT_LEARN_MORE_URL } from '@modules/miscellaneous/common/constants/linkConstants';
import ThumbnailImageUploader from '@modules/miscellaneous/components/uploaders/components/ThumbnailImageUploader';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { ButtonLink } from '@modules/monetization-shared/button-link';
import { Link } from '@modules/monetization-shared/link';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import DisallowPriceChangeInExperimentBanner from '@modules/price-optimization/components/DisallowPriceChangeInExperimentBanner';
import type { ConfigureDeveloperProductFormV2Values, DeveloperProduct } from '../../types';
import {
  DescriptionTextArea,
  NameTextInput,
  PriceTextInput,
} from '../form-shared/DeveloperProductFieldsV3';
import RegionalPricesDisplay from '../form-shared/RegionalPricesDisplay';

type Props = {
  universeId: number;
  productId: number;
  developerProduct: DeveloperProduct;
  giftingTradingStatus?: GiftingTradingStatus;
  managedPricingOnboardingStatus: ManagedPricingOnboardingStatus | undefined;
  isPending?: boolean;
  shopId?: number;
};

const getDeveloperProductsUrl = dashboard.getMonetizationDeveloperProductsUrl;

function ConfigureDeveloperProductFormV3({
  universeId,
  productId,
  developerProduct,
  giftingTradingStatus,
  managedPricingOnboardingStatus,
  isPending = false,
  shopId,
}: Props) {
  const { translate } = useTranslation();

  const {
    register,
    reset,
    trigger,
    handleSubmit,
    control,
    formState: { isValid, isDirty, isSubmitting },
    setValue,
    getValues,
  } = useFormContext<ConfigureDeveloperProductFormV2Values>();

  const [errorMessage, setErrorMessage] = useState<string>(() =>
    developerProduct.isImmutable ? translate('Error.UnsupportedDeveloperProductUpdate') : '',
  );

  const { mutateAsync: updateDeveloperProduct, isPending: isUpdatePending } =
    useUpdateDeveloperProduct(
      { universeId, productId, shopId },
      {
        onErrorResponse: (errorKey) => {
          if (errorKey === undefined) {
            return false; // Pass through to the default error handling
          }
          setErrorMessage(translate(errorKey));
          return true; // Skip remaining error handling
        },
        onError: () => {
          setErrorMessage(translate('Error.Submit'));
        },
      },
    );

  const saveChanges: SubmitHandler<ConfigureDeveloperProductFormV2Values> =
    useCallback(async () => {
      setErrorMessage('');
      // Note: we use getValues() instead of submit data as submit data does not include disabled fields
      // Only use submit data to trigger final state validation e.g., disclaimers
      const values = getValues();

      try {
        await updateDeveloperProduct({
          name: values.name,
          description: values.description,
          imageFile: values.file,
          isForSale: values.isForSale ?? undefined,
          price: values.price ?? undefined,
          // NOTE(@jeminpark): we are temporarily using isRegionalPricingEnabled to match the old form such
          // that components are reused. This should be changed to isManagedPricingEnabled in the future.
          isManagedPricingEnabled: values.isRegionalPricingEnabled,
        });

        reset(values);

        toast({ title: translate('Message.SuccessfullyUpdatedDeveloperProduct') });
      } catch {
        // Errors are surfaced via the mutation hook's onErrorResponse/onError callbacks,
        // which already populate `errorMessage`. Don't overwrite that specific message here.
      }
    }, [getValues, reset, translate, updateDeveloperProduct]);

  const initiateSaveChanges: SubmitHandler<ConfigureDeveloperProductFormV2Values> = useCallback(
    async (data) => {
      await withManagedPricingSubmitGuard({
        universeId,
        currentStatus: developerProduct.isRegionalPricingEnabled,
        // NOTE(@jeminpark): we are temporarily using isRegionalPricingEnabled to match the old form such
        // that components are reused. This should be changed to isManagedPricingEnabled in the future.
        targetStatus: data.isRegionalPricingEnabled ?? undefined,
        onboardingStatus: managedPricingOnboardingStatus,
        giftingTradingStatus,
        page: '/creations/developer-product/configure',
        onConfirm: () => void saveChanges(data),
      });
    },
    [
      universeId,
      developerProduct.isRegionalPricingEnabled,
      giftingTradingStatus,
      managedPricingOnboardingStatus,
      saveChanges,
    ],
  );

  const handleFileChange = useCallback(
    (file: File | null) => setValue('file', file, { shouldValidate: true, shouldDirty: true }),
    [setValue],
  );

  // Note: we only need to revalidate price, as the other fields don't have cross-field validation
  const revalidatePrice = useCallback(() => {
    void trigger('price');
  }, [trigger]);

  const developerProductsUrl = getDeveloperProductsUrl(universeId);

  const isAllPending = isSubmitting || isPending || isUpdatePending;

  const isPricingConfigChangeAllowed =
    !developerProduct.isInActivePriceOptimizationExperiment && !developerProduct.isImmutable;

  // Only show gifting trading warnings if managed pricing is already enabled
  const shouldShowGiftingTradingWarningBanner =
    developerProduct.isRegionalPricingEnabled &&
    shouldShowGiftingTradingReminder(giftingTradingStatus);

  // Use `useWatch` so that toggling `isForSale` re-renders dependent disabling/dimming logic.
  const currentIsForSale = useWatch({ control, name: 'isForSale' });

  return (
    <form
      className='flex flex-col gap-[40px] margin-bottom-medium'
      onSubmit={handleSubmit(initiateSaveChanges)}>
      {/* TODO: migrating to title */}
      <div className='flex flex-col gap-large'>
        <span className='text-body-large'>
          {translate('Message.CreateDeveloperProductInfo')}&nbsp;
          <Link href={DEVELOPER_PRODUCT_LEARN_MORE_URL} target='_blank'>
            {translate('Label.LearnMore')}
          </Link>
        </span>

        <GiftingTradingWarningBannerV2
          universeId={universeId}
          page='/configure'
          giftingTradingStatus={giftingTradingStatus}
          enabled={shouldShowGiftingTradingWarningBanner}
        />

        <DisallowPriceChangeInExperimentBanner
          enabled={developerProduct.isInActivePriceOptimizationExperiment}
        />
      </div>

      <ThumbnailImageUploader
        onChange={handleFileChange}
        targetId={developerProduct.iconImageAssetId}
        targetType={ThumbnailTypes.assetThumbnail}
        targetReturnPolicy={ReturnPolicy.PlaceHolder}
        imageType={['jpg', 'png', 'bmp']}
        disabled={developerProduct.isImmutable}
      />

      <section className='flex flex-col gap-xlarge max-width-[678px]'>
        <h2 className='text-heading-small large:text-heading-medium margin-none'>
          {translate('Heading.ProductDetails')}
        </h2>

        <NameTextInput
          control={control}
          register={register}
          label={translate('Label.Name')}
          disabled={developerProduct.isImmutable}
        />

        <DescriptionTextArea
          control={control}
          register={register}
          label={translate('Label.Description')}
          disabled={developerProduct.isImmutable}
        />

        <div className='flex flex-col gap-large'>
          <div className='flex justify-between items-center'>
            <label htmlFor='price' className='text-title-large'>
              {translate('Label.Price')}
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
                  onCheckedChange={(isChecked) => {
                    field.onChange(isChecked);
                    revalidatePrice();
                  }}
                  isDisabled={!isPricingConfigChangeAllowed}
                />
              )}
            />
          </div>

          <PriceTextInput
            id='price'
            control={control}
            register={register}
            universeId={universeId}
            disabled={!isPricingConfigChangeAllowed || !currentIsForSale}
            error={
              developerProduct.isInActivePriceOptimizationExperiment
                ? translate('Message.DisallowPriceChangeInExperimentHelper')
                : undefined
            }
          />
        </div>

        <div className='flex flex-col gap-large'>
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
                  onCheckedChange={(isChecked) => {
                    field.onChange(isChecked);
                    revalidatePrice();
                  }}
                  isDisabled={
                    (field.disabled ?? false) || !isPricingConfigChangeAllowed || !currentIsForSale
                  }
                />
              )}
            />
          </div>

          <RegionalPricesDisplay universeId={universeId} control={control} shouldUnmount={false} />
        </div>

        <div className='flex flex-col gap-small'>
          <div className='flex flex-col-reverse gap-medium padding-top-small medium:flex-row'>
            <ButtonLink
              variant='Standard'
              size='Large'
              className='padding-x-xlarge'
              href={developerProductsUrl}
              isDisabled={isSubmitting}>
              {translate('Action.Cancel')}
            </ButtonLink>

            <Button
              type='submit'
              variant='Emphasis'
              size='Large'
              className='padding-x-xlarge'
              isDisabled={!isDirty || !isValid || isAllPending || developerProduct.isImmutable}
              isLoading={isAllPending}>
              {translate('Action.SaveChanges')}
            </Button>
          </div>

          {errorMessage && (
            <span
              aria-live='assertive'
              className='text-caption-medium content-system-alert padding-x-small'>
              {errorMessage}
            </span>
          )}
        </div>
      </section>
    </form>
  );
}

function ConfigureDeveloperProductFormContainer(props: Props) {
  const { developerProduct } = props;

  const methods = useForm<ConfigureDeveloperProductFormV2Values>({
    mode: 'onChange',
    defaultValues: {
      name: developerProduct.name,
      description: developerProduct.description,
      isForSale: developerProduct.isForSale,
      price: developerProduct.defaultPriceInRobux,
      file: null, // use null as a placeholder for whether file is NOT changed
      // NOTE(@jeminpark): we are temporarily using isRegionalPricingEnabled to match the old form such
      // that components are reused. This should be changed to isManagedPricingEnabled in the future.
      isRegionalPricingEnabled: developerProduct.isRegionalPricingEnabled,
      categoryName: null,
    },
  });

  const { reset } = methods;

  // Reset the form values when the developer product details change
  useEffect(() => {
    // Note: we don't reset file here, as it is independent of the other fields here
    reset({
      name: developerProduct.name,
      description: developerProduct.description,
      isForSale: developerProduct.isForSale,
      price: developerProduct.defaultPriceInRobux,
      // NOTE(@jeminpark): we are temporarily using isRegionalPricingEnabled to match the old form such
      // that components are reused. This should be changed to isManagedPricingEnabled in the future.
      isRegionalPricingEnabled: developerProduct.isRegionalPricingEnabled,
      categoryName: null,
    });
  }, [developerProduct, reset]);

  return (
    <FormProvider {...methods}>
      <ConfigureDeveloperProductFormV3 {...props} />
    </FormProvider>
  );
}

export default ConfigureDeveloperProductFormContainer;
