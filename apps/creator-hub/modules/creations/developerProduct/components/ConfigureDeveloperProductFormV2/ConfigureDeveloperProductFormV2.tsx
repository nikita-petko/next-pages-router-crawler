import { useCallback, useEffect, useState } from 'react';
import { FormProvider, SubmitHandler, useForm, useFormContext } from 'react-hook-form';
import NextLink from 'next/link';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import { useTranslation } from '@rbx/intl';
import { Button, ErrorOutlineOutlinedIcon, FormHelperText, useSnackbar } from '@rbx/ui';
import { clsx } from '@rbx/foundation-ui';
import type { GiftingTradingStatus } from '@rbx/clients/developerProductsApi';
import { ThumbnailImageUploader } from '@modules/miscellaneous/common/components/uploaders';
import { DEVELOPER_PRODUCT_LEARN_MORE_URL } from '@modules/miscellaneous/common/constants/linkConstants';
import DisallowPriceChangeInExperimentBanner from '@modules/price-optimization/components/DisallowPriceChangeInExperimentBanner';
import DeveloperProductRegionalPricingDisclaimerModal, {
  useDeveloperProductRegionalPricingDisclaimer,
} from '@modules/regional-pricing/components/DeveloperProductRegionalPricingDisclaimerModal/DeveloperProductRegionalPricingDisclaimerModal';
import GiftingTradingWarningBanner, {
  shouldShowGiftingTradingReminder,
} from '@modules/regional-pricing/components/GiftingTradingWarningBanner';
import NewRegionalPricingBanner from '@modules/regional-pricing/components/NewRegionalPricingBanner';
import ControllerCheckboxWithTooltip from '@modules/monetization-shared/form/ControllerCheckboxWithTooltip';
import { useUpdateDeveloperProduct } from '@modules/developer-products/queries/useUpdateDeveloperProduct';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import type { DeveloperProduct, ConfigureDeveloperProductFormV2Values } from '../../types';
import RegionalPricesDisplay from '../form-shared/RegionalPricesDisplay';
import {
  NameTextField,
  DescriptionTextField,
  PriceTextField,
} from '../form-shared/DeveloperProductFields';

type Props = {
  universeId: number;
  productId: number;
  developerProduct: DeveloperProduct;
  giftingTradingStatus?: GiftingTradingStatus;
  isEligibleForExternalStorePurchase?: boolean;
  isPending?: boolean;
};

const getDeveloperProductsUrl = dashboard.getMonetizationDeveloperProductsUrl;
const getPriceCheckLink = dashboard.getMonetizationDynamicPriceCheckUrl;

function ConfigureDeveloperProductFormV2({
  universeId,
  productId,
  developerProduct,
  giftingTradingStatus,
  isEligibleForExternalStorePurchase = false,
  isPending = false,
}: Props) {
  const { translate, translateHTML } = useTranslation();

  const {
    register,
    trigger,
    handleSubmit,
    control,
    formState: { isValid, isDirty, isSubmitting },
    setValue,
  } = useFormContext<ConfigureDeveloperProductFormV2Values>();

  const [errorMessage, setErrorMessage] = useState<string>(() =>
    developerProduct.isImmutable ? translate('Error.UnsupportedDeveloperProductUpdate') : '',
  );

  const { enqueue } = useSnackbar();
  const showSuccessToast = useCallback(() => {
    enqueue(
      { message: translate('Message.SuccessfullyUpdatedDeveloperProduct'), autoHide: true },
      (reason) => reason === 'timeout',
    );
  }, [enqueue, translate]);

  const { mutateAsync: updateDeveloperProduct, isPending: isUpdatePending } =
    useUpdateDeveloperProduct(
      { universeId, productId },
      {
        onSuccess: showSuccessToast,
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

  const saveChanges: SubmitHandler<ConfigureDeveloperProductFormV2Values> = useCallback(
    async (data) => {
      setErrorMessage('');

      if (data.storePageEnabled && !data.file && !developerProduct.iconImageAssetId) {
        setErrorMessage(translate('Error.ThumbnailRequiredForDetailsPage'));
        return;
      }

      await updateDeveloperProduct({
        name: data.name,
        description: data.description,
        imageFile: data.file,
        isForSale: !!data.price, // strongly tie price to for sale status until design update
        price: data.price || undefined, // default falsy (NaN, 0, undefined) values to undefined
        // Price is required to enable sales and pricing features
        storePageEnabled: !!data.price && data.storePageEnabled,
        isRegionalPricingEnabled: !!data.price && data.isRegionalPricingEnabled,
      }).catch(() => false); // Errors are handled via the mutation hook
    },
    [developerProduct.iconImageAssetId, translate, updateDeveloperProduct],
  );

  const { withDisclaimer: withRegionalPricingDisclaimer } =
    useDeveloperProductRegionalPricingDisclaimer(universeId);

  const saveChangesWithAck: SubmitHandler<ConfigureDeveloperProductFormV2Values> = useCallback(
    (data) =>
      withRegionalPricingDisclaimer(() => saveChanges(data), {
        enabled: data.isRegionalPricingEnabled,
      }),
    [saveChanges, withRegionalPricingDisclaimer],
  );

  // Note: we only need to revalidate price, as the other fields don't have cross-field validation
  const revalidatePrice = useCallback(() => {
    trigger('price');
  }, [trigger]);

  const developerProductsUrl = getDeveloperProductsUrl(universeId);

  const isAllPending = isSubmitting || isPending || isUpdatePending;

  // TODO: refactor to enforce single banner state at a time

  const isPricingConfigChangeAllowed =
    !developerProduct.isInActivePriceOptimizationExperiment && !developerProduct.isImmutable;

  // Only show gifting trading warnings if regional pricing is already enabled
  const shouldShowGiftingTradingWarningBanner =
    developerProduct.isRegionalPricingEnabled &&
    shouldShowGiftingTradingReminder(giftingTradingStatus);

  return (
    <form className='flex flex-col gap-[40px]' onSubmit={handleSubmit(saveChangesWithAck)}>
      <div className='flex flex-col gap-large'>
        <span className='text-body-large'>
          {translate('Message.CreateDeveloperProductInfo')}&nbsp;
          <NextLink
            className='content-link no-underline hover:underline'
            href={DEVELOPER_PRODUCT_LEARN_MORE_URL}
            target='_blank'>
            {translate('Label.LearnMore')}
          </NextLink>
        </span>
      </div>

      <GiftingTradingWarningBanner
        universeId={universeId}
        page='/configure'
        giftingTradingStatus={giftingTradingStatus}
        enabled={shouldShowGiftingTradingWarningBanner}
      />

      <NewRegionalPricingBanner
        universeId={universeId}
        type='developerproduct'
        enabled={isPricingConfigChangeAllowed && !shouldShowGiftingTradingWarningBanner}
      />

      <DisallowPriceChangeInExperimentBanner
        enabled={developerProduct.isInActivePriceOptimizationExperiment}
      />

      <ThumbnailImageUploader
        onChange={(file: File | null) => setValue('file', file, { shouldDirty: true })}
        targetId={developerProduct.iconImageAssetId}
        targetType={ThumbnailTypes.assetThumbnail}
        targetReturnPolicy={ReturnPolicy.PlaceHolder}
        imageType={['jpg', 'png', 'bmp']}
        disabled={developerProduct.isImmutable}
      />

      <section className='flex flex-col gap-xxlarge max-width-[678px]'>
        <h2 className='text-heading-small large:text-heading-medium margin-none'>
          {translate('Heading.ProductDetails')}
        </h2>

        <NameTextField
          register={register}
          label={translate('Label.Name')}
          disabled={developerProduct.isImmutable}
        />

        <DescriptionTextField
          register={register}
          label={translate('Label.Description')}
          disabled={developerProduct.isImmutable}
        />

        <PriceTextField
          register={register}
          universeId={universeId}
          label={translate('Label.DefaultPrice')}
          disabled={!isPricingConfigChangeAllowed}
          helperText={
            developerProduct.isInActivePriceOptimizationExperiment
              ? translate('Message.DisallowPriceChangeInExperimentHelper')
              : undefined
          }
        />

        <div
          className={clsx(
            'flex flex-col padding-x-medium',
            'margin-top-[-14px]', // Offset to account for extra padding from MUI Checkboxes
          )}>
          {isEligibleForExternalStorePurchase && (
            <ControllerCheckboxWithTooltip
              name='storePageEnabled'
              control={control}
              onChange={revalidatePrice}
              label={translate('Message.ExposeToExternalSales')}
              tooltip={translate('Message.ExternalPurchaseInfo')}
              disabled={developerProduct.isImmutable}
            />
          )}

          <div className='flex flex-col'>
            <ControllerCheckboxWithTooltip
              name='isRegionalPricingEnabled'
              control={control}
              onChange={revalidatePrice}
              label={translate('Label.EnableRegionalPricing')}
              tooltip={translate('Tooltip.EnableRegionalPricingDetailed')}
              disabled={!isPricingConfigChangeAllowed}
            />

            <div className='flex items-center gap-[11px] no-wrap'>
              <ErrorOutlineOutlinedIcon color='warning' />

              <span className='text-body-medium'>
                {translateHTML('Description.RequiresDynamicPrices', [
                  {
                    opening: 'linkStart',
                    closing: 'linkEnd',
                    content: (chunks) => (
                      <NextLink
                        className='content-inherit underline'
                        href={getPriceCheckLink(universeId)}>
                        {chunks}
                      </NextLink>
                    ),
                  },
                ])}
              </span>
            </div>
          </div>
        </div>

        <RegionalPricesDisplay universeId={universeId} control={control} />

        <div className='flex flex-col gap-small'>
          <div className='flex flex-col-reverse gap-medium padding-top-small medium:flex-row'>
            <Button
              variant='outlined'
              color='primary'
              size='large'
              component={NextLink}
              href={developerProductsUrl}
              disabled={isSubmitting}>
              {translate('Action.Cancel')}
            </Button>

            <Button
              type='submit'
              variant='contained'
              size='large'
              disabled={!isDirty || !isValid || isAllPending || developerProduct.isImmutable}
              loading={isAllPending}>
              {translate('Action.SaveChanges')}
            </Button>
          </div>

          {errorMessage && (
            <FormHelperText
              error
              className='text-caption-medium content-system-alert padding-x-small'>
              {errorMessage}
            </FormHelperText>
          )}
        </div>
      </section>
    </form>
  );
}

function ConfigureDeveloperProductFormContainer(props: Props) {
  const { universeId, developerProduct } = props;

  // NOTE(VEO-641): price used to be strongly tied to `isForSale` (where we return null if offsale),
  // but we are separating these two concepts and will be returning default price independently of
  // `isForSale`. Until the on-sale toggle is added, we use this to determine current price.
  const defaultPrice = developerProduct.isForSale ? developerProduct.defaultPriceInRobux : null;

  const methods = useForm<ConfigureDeveloperProductFormV2Values>({
    mode: 'onChange',
    defaultValues: {
      name: developerProduct.name,
      description: developerProduct.description,
      price: defaultPrice,
      file: null, // use null as a placeholder for whether file is NOT changed
      storePageEnabled: developerProduct.isStorePageEnabled,
      isRegionalPricingEnabled: developerProduct.isRegionalPricingEnabled,
    },
  });

  const { reset } = methods;

  // Reset the form values when the developer product details change
  useEffect(() => {
    // Note: we don't reset file here, as it is independent of the other fields here
    reset({
      name: developerProduct.name,
      description: developerProduct.description,
      price: defaultPrice,
      storePageEnabled: developerProduct.isStorePageEnabled,
      isRegionalPricingEnabled: developerProduct.isRegionalPricingEnabled,
    });
  }, [defaultPrice, developerProduct, reset]);

  return (
    <FormProvider {...methods}>
      <ConfigureDeveloperProductFormV2 {...props} />

      <DeveloperProductRegionalPricingDisclaimerModal universeId={universeId} page='/configure' />
    </FormProvider>
  );
}

export default ConfigureDeveloperProductFormContainer;
