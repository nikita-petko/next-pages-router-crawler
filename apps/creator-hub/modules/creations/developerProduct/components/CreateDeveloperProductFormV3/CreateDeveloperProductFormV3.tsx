import { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import type { SubmitHandler } from 'react-hook-form';
import { Controller, FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form';
import type { GiftingTradingStatus } from '@rbx/client-developer-products-api/v1';
import type { Category } from '@rbx/client-shops-api/v1';
import { Button, clsx, Toggle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useCreateDeveloperProduct } from '@modules/developer-products/queries/useCreateDeveloperProduct';
import PriceCheckProductCreationWarning from '@modules/dynamic-price-check/components/PriceCheckProductCreationWarning';
import { withManagedPricingSubmitGuard } from '@modules/managed-pricing/dialogs/withManagedPricingSubmitGuard';
import type { ManagedPricingOnboardingStatus } from '@modules/managed-pricing/types';
import { DEVELOPER_PRODUCT_LEARN_MORE_URL } from '@modules/miscellaneous/common/constants/linkConstants';
import ThumbnailImageUploader from '@modules/miscellaneous/components/uploaders/components/ThumbnailImageUploader';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { ButtonLink } from '@modules/monetization-shared/button-link';
import { Link } from '@modules/monetization-shared/link';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import { useBatchUpdateShopItems } from '@modules/shops/queries/useBatchUpdateShopItems';
import {
  buildNewItemCategoryEdits,
  resolveCategorySelection,
} from '@modules/shops/utils/categorySelection';
import type { ConfigureDeveloperProductFormV2Values } from '../../types';
import {
  DescriptionTextArea,
  NameTextInput,
  PriceTextInput,
  ShopCategoryComboboxField,
} from '../form-shared/DeveloperProductFieldsV3';
import RegionalPricesDisplay from '../form-shared/RegionalPricesDisplay';

type Props = {
  universeId: number;
  managedPricingOnboardingStatus: ManagedPricingOnboardingStatus | undefined;
  giftingTradingStatus?: GiftingTradingStatus;
  shopId?: number;
  availableCategories?: readonly Category[];
};

const getDeveloperProductsUrl = dashboard.getMonetizationDeveloperProductsUrl;

const EMPTY_CATEGORIES: readonly Category[] = [];

function CreateDeveloperProductFormV3({
  universeId,
  managedPricingOnboardingStatus,
  giftingTradingStatus,
  shopId,
  availableCategories = EMPTY_CATEGORIES,
}: Props) {
  const { translate } = useTranslation();
  const router = useRouter();

  const {
    register,
    trigger,
    handleSubmit,
    control,
    getFieldState,
    formState: { isValid, isDirty, isSubmitting },
    setValue,
    getValues,
  } = useFormContext<ConfigureDeveloperProductFormV2Values>();

  const [errorMessage, setErrorMessage] = useState<string>('');

  const { mutateAsync: batchUpdateShopItems } = useBatchUpdateShopItems();

  const { mutateAsync: createDeveloperProduct, isPending: isCreatePending } =
    useCreateDeveloperProduct(
      { universeId, shopId },
      {
        onErrorResponse: (errorKey) => {
          if (!errorKey) {
            setErrorMessage(translate('Error.Submit'));
          } else {
            setErrorMessage(translate(errorKey));
          }
        },
      },
    );

  const developerProductsUrl = getDeveloperProductsUrl(universeId);

  const saveChanges: SubmitHandler<ConfigureDeveloperProductFormV2Values> =
    useCallback(async () => {
      setErrorMessage('');
      // Note: we use getValues() instead of submit data as submit data does not include disabled fields
      const values = getValues();

      // TODO(@jeminpark): revisit this with managed pricing default true
      // Price and managed pricing are only meaningful for items that are for sale. When the
      // creator has opted out of sale (`isForSale !== true`), omit both from the create payload
      // so the API records the product without a price or managed-pricing configuration. The
      // creator can edit those fields later from the Configure form once they enable sale.
      const isForSaleSubmit = values.isForSale === true;

      try {
        const price = values.price ?? undefined;

        const created = await createDeveloperProduct({
          name: values.name,
          description: values.description,
          imageFile: values.file,
          isForSale: Boolean(values.isForSale),
          price: isForSaleSubmit ? price : undefined,
          // NOTE(@jeminpark): we are temporarily using isRegionalPricingEnabled to match the old form such
          // that components are reused. This should be changed to isManagedPricingEnabled in the future.
          isManagedPricingEnabled: isForSaleSubmit
            ? values.isRegionalPricingEnabled || undefined
            : undefined,
        });

        // TODO: the product already exists, so a failure here must not block navigation or
        // the success toast. Decide how to handle a failure here (let user know and they
        // can make change on shops page)
        if (shopId !== undefined) {
          const selection = resolveCategorySelection(
            values.categoryName ?? '',
            availableCategories,
          );
          if (selection) {
            try {
              await batchUpdateShopItems({
                shopId,
                ...buildNewItemCategoryEdits(
                  { type: 'DeveloperProduct', id: created.productId.toString() },
                  selection,
                ),
              });
            } catch {
              // Best-effort; product creation already succeeded.
            }
          }
        }

        await router.push(developerProductsUrl);

        toast({ title: translate('Message.SuccessfullyCreatedDeveloperProduct') });
      } catch {
        // Errors are handled via the mutation hook
      }
    }, [
      createDeveloperProduct,
      getValues,
      router,
      developerProductsUrl,
      translate,
      shopId,
      availableCategories,
      batchUpdateShopItems,
    ]);

  const initiateSaveChanges: SubmitHandler<ConfigureDeveloperProductFormV2Values> = useCallback(
    async (data) => {
      await withManagedPricingSubmitGuard({
        universeId,
        currentStatus: false,
        // NOTE(@jeminpark): we are temporarily using isRegionalPricingEnabled to match the old form such
        // that components are reused. This should be changed to isManagedPricingEnabled in the future.
        targetStatus: data.isForSale && data.isRegionalPricingEnabled ? true : undefined,
        onboardingStatus: managedPricingOnboardingStatus,
        giftingTradingStatus,
        page: '/creations/developer-product/create',
        onConfirm: () => void saveChanges(data),
      });
    },
    [universeId, managedPricingOnboardingStatus, giftingTradingStatus, saveChanges],
  );

  const handleFileChange = useCallback(
    (file: File | null) => {
      // Set default name to file name if uploading
      setValue('file', file, { shouldValidate: true, shouldDirty: true });
      if (!getFieldState('name').isDirty) {
        setValue('name', file ? file.name : '', { shouldValidate: true, shouldDirty: true });
      }
    },
    [setValue, getFieldState],
  );

  // Note: we only need to revalidate price, as the other fields don't have cross-field validation
  const revalidatePrice = useCallback(() => {
    void trigger('price');
  }, [trigger]);

  const isCreating = isSubmitting || isCreatePending;

  // Use `useWatch` so that toggling `isForSale` re-renders dependent disabling/dimming logic.
  const currentIsForSale = useWatch({ control, name: 'isForSale' });

  // Category field only renders when a shop id is available (feature enabled).
  // All combobox logic lives in `ShopCategoryComboboxField`.
  const showCategoryField = shopId !== undefined;

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
      </div>

      <PriceCheckProductCreationWarning />

      <ThumbnailImageUploader onChange={handleFileChange} imageType={['jpg', 'png', 'bmp']} />

      <section className='flex flex-col gap-xlarge max-width-[678px]'>
        <h2 className='text-heading-small large:text-heading-medium margin-none'>
          {translate('Heading.ProductDetails')}
        </h2>

        <NameTextInput control={control} register={register} label={translate('Label.Name')} />

        <DescriptionTextArea
          control={control}
          register={register}
          label={translate('Label.Description')}
        />

        {showCategoryField && (
          <ShopCategoryComboboxField control={control} availableCategories={availableCategories} />
        )}

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
                  id='isForSale'
                  label={translate('Label.ItemForSale')}
                  size='Medium'
                  placement='Start'
                  ref={field.ref}
                  name={field.name}
                  isChecked={Boolean(field.value)}
                  onCheckedChange={(isChecked) => {
                    field.onChange(isChecked);
                    revalidatePrice();
                  }}
                  onBlur={field.onBlur}
                  isDisabled={field.disabled}
                />
              )}
            />
          </div>

          <PriceTextInput
            id='price'
            control={control}
            register={register}
            universeId={universeId}
            disabled={!currentIsForSale}
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
                  id='isRegionalPricingEnabled'
                  label={translate('Label.Enabled')}
                  size='Medium'
                  placement='Start'
                  ref={field.ref}
                  name={field.name}
                  isChecked={field.value}
                  onCheckedChange={(isChecked) => {
                    field.onChange(isChecked);
                    revalidatePrice();
                  }}
                  onBlur={field.onBlur}
                  isDisabled={(field.disabled ?? false) || !currentIsForSale}
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
              isDisabled={!isDirty || !isValid || isCreating}
              isLoading={isCreating}>
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

function CreateDeveloperProductFormContainer(props: Props) {
  const methods = useForm<ConfigureDeveloperProductFormV2Values>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      price: null,
      // Default to on-sale: most newly created developer products are intended to be sold,
      // and the price/managed-pricing fields below are only meaningful when isForSale is true.
      // When the creator opts out of sale, `saveChanges` omits price and managed pricing from
      // the create payload entirely (see comment in `saveChanges`).
      isForSale: true,
      file: null, // use null as a placeholder for whether file is NOT changed
      // NOTE(@jeminpark): we are temporarily using isRegionalPricingEnabled to match the old form such
      // that components are reused. This should be changed to isManagedPricingEnabled in the future.
      isRegionalPricingEnabled: true, // default to true if eligible
      categoryName: null,
    },
  });

  return (
    <FormProvider {...methods}>
      <CreateDeveloperProductFormV3 {...props} />
    </FormProvider>
  );
}

export default CreateDeveloperProductFormContainer;
