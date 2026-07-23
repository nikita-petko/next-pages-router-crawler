import { useCallback, useEffect, useState } from 'react';
import NextLink from 'next/link';
import type { SubmitHandler } from 'react-hook-form';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import type { GiftingTradingStatus } from '@rbx/client-developer-products-api/v1';
import { clsx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import { Button, ErrorOutlineOutlinedIcon, FormHelperText } from '@rbx/ui';
import { useUpdateDeveloperProduct } from '@modules/developer-products/queries/useUpdateDeveloperProduct';
import { shouldShowGiftingTradingReminder } from '@modules/managed-pricing/gifting-trading/utils';
import { DEVELOPER_PRODUCT_LEARN_MORE_URL } from '@modules/miscellaneous/common/constants/linkConstants';
import ThumbnailImageUploader from '@modules/miscellaneous/components/uploaders/components/ThumbnailImageUploader';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { ControllerCheckboxWithTooltip } from '@modules/monetization-shared/form/ControllerCheckboxWithTooltip';
import { Link } from '@modules/monetization-shared/link';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import DisallowPriceChangeInExperimentBanner from '@modules/price-optimization/components/DisallowPriceChangeInExperimentBanner';
import DeveloperProductRegionalPricingDisclaimerModal, {
  useDeveloperProductRegionalPricingDisclaimer,
} from '@modules/regional-pricing/components/DeveloperProductRegionalPricingDisclaimerModal/DeveloperProductRegionalPricingDisclaimerModal';
import GiftingTradingWarningBanner from '@modules/regional-pricing/components/GiftingTradingWarningBanner';
import NewRegionalPricingBanner from '@modules/regional-pricing/components/NewRegionalPricingBanner';
import type { DeveloperProduct, ConfigureDeveloperProductFormV2Values } from '../../types';
import {
  NameTextField,
  DescriptionTextField,
  PriceTextField,
} from '../form-shared/DeveloperProductFields';
import RegionalPricesDisplay from '../form-shared/RegionalPricesDisplay';

type Props = {
  universeId: number;
  productId: number;
  developerProduct: DeveloperProduct;
  giftingTradingStatus?: GiftingTradingStatus;
  isPending?: boolean;
  shopId?: number;
};

const getDeveloperProductsUrl = dashboard.getMonetizationDeveloperProductsUrl;
const getPriceCheckLink = dashboard.getMonetizationDynamicPriceCheckUrl;

function ConfigureDeveloperProductFormV2({
  universeId,
  productId,
  developerProduct,
  giftingTradingStatus,
  isPending = false,
  shopId,
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

  const saveChanges: SubmitHandler<ConfigureDeveloperProductFormV2Values> = useCallback(
    async (data) => {
      setErrorMessage('');

      try {
        await updateDeveloperProduct({
          name: data.name,
          description: data.description,
          imageFile: data.file,
          isForSale: !!data.price, // strongly tie price to for sale status until design update
          // oxlint-disable-next-line typescript/prefer-nullish-coalescing -- default falsy (NaN, 0, undefined) values to undefined
          price: data.price || undefined,
          isRegionalPricingEnabled: !!data.price && data.isRegionalPricingEnabled,
        });

        toast({ title: translate('Message.SuccessfullyUpdatedDeveloperProduct') });
      } catch {
        // Errors are handled via the mutation hook
      }
    },
    [translate, updateDeveloperProduct],
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
    void trigger('price');
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
          <Link href={DEVELOPER_PRODUCT_LEARN_MORE_URL} target='_blank'>
            {translate('Label.LearnMore')}
          </Link>
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
      isForSale: null, // Not used for this form
      price: defaultPrice,
      file: null, // use null as a placeholder for whether file is NOT changed
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
      price: defaultPrice,
      isRegionalPricingEnabled: developerProduct.isRegionalPricingEnabled,
      categoryName: null,
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
