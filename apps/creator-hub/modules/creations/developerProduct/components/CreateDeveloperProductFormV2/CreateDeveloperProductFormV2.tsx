import { useCallback, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import type { SubmitHandler } from 'react-hook-form';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { clsx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Button, ErrorOutlineOutlinedIcon, FormHelperText } from '@rbx/ui';
import { useCreateDeveloperProduct } from '@modules/developer-products/queries/useCreateDeveloperProduct';
import PriceCheckProductCreationWarning from '@modules/dynamic-price-check/components/PriceCheckProductCreationWarning';
import { DEVELOPER_PRODUCT_LEARN_MORE_URL } from '@modules/miscellaneous/common/constants/linkConstants';
import ThumbnailImageUploader from '@modules/miscellaneous/components/uploaders/components/ThumbnailImageUploader';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { ControllerCheckboxWithTooltip } from '@modules/monetization-shared/form/ControllerCheckboxWithTooltip';
import { Link } from '@modules/monetization-shared/link';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import DeveloperProductRegionalPricingDisclaimerModal, {
  useDeveloperProductRegionalPricingDisclaimer,
} from '@modules/regional-pricing/components/DeveloperProductRegionalPricingDisclaimerModal/DeveloperProductRegionalPricingDisclaimerModal';
import NewRegionalPricingBanner from '@modules/regional-pricing/components/NewRegionalPricingBanner';
import type { ConfigureDeveloperProductFormV2Values } from '../../types';
import {
  NameTextField,
  DescriptionTextField,
  PriceTextField,
} from '../form-shared/DeveloperProductFields';
import RegionalPricesDisplay from '../form-shared/RegionalPricesDisplay';

type Props = {
  universeId: number;
  shopId?: number;
};

const getDeveloperProductsUrl = dashboard.getMonetizationDeveloperProductsUrl;
const getPriceCheckLink = dashboard.getMonetizationDynamicPriceCheckUrl;

function CreateDeveloperProductFormV2({ universeId, shopId }: Props) {
  const { translate, translateHTML } = useTranslation();
  const router = useRouter();

  const {
    register,
    trigger,
    handleSubmit,
    control,
    getFieldState,
    formState: { isValid, isDirty, isSubmitting },
    setValue,
  } = useFormContext<ConfigureDeveloperProductFormV2Values>();

  const [errorMessage, setErrorMessage] = useState<string>('');
  const { error: monitorError } = useMetricsMonitoring();

  const { mutateAsync: createDeveloperProduct, isPending: isCreatePending } =
    useCreateDeveloperProduct(
      { universeId, shopId },
      {
        onErrorResponse: (errorKey, error) => {
          if (!errorKey) {
            setErrorMessage(translate('Error.Submit'));
          } else {
            setErrorMessage(translate(errorKey));
          }
          monitorError(error.toString());
        },
      },
    );

  const handleFileChange = useCallback(
    (file: File | null) => {
      setValue('file', file, { shouldValidate: true, shouldDirty: true });
      if (!getFieldState('name').isDirty) {
        setValue('name', file ? file.name : '', { shouldValidate: true, shouldDirty: true });
      }
    },
    [setValue, getFieldState],
  );

  const developerProductsUrl = getDeveloperProductsUrl(universeId);

  const saveChanges: SubmitHandler<ConfigureDeveloperProductFormV2Values> = useCallback(
    async (data) => {
      setErrorMessage('');

      try {
        await createDeveloperProduct({
          name: data.name,
          description: data.description,
          imageFile: data.file,
          isForSale: !!data.price || undefined, // strongly tie price to for sale status until design update
          // oxlint-disable-next-line typescript/prefer-nullish-coalescing -- default falsy (NaN, 0, undefined) values to undefined
          price: data.price || undefined,
          isRegionalPricingEnabled: data.isRegionalPricingEnabled || undefined, // default falsy values to undefined
        });

        toast({ title: translate('Message.SuccessfullyCreatedDeveloperProduct') });
        await router.push(developerProductsUrl);
      } catch {
        // Errors are handled via the mutation hook
      }
    },
    [createDeveloperProduct, router, developerProductsUrl, translate],
  );

  const { withDisclaimer: withRegionalPricingDisclaimer } =
    useDeveloperProductRegionalPricingDisclaimer(universeId);

  const saveChangesWithAck: SubmitHandler<ConfigureDeveloperProductFormV2Values> = useCallback(
    (data) =>
      withRegionalPricingDisclaimer(() => saveChanges(data), {
        enabled: data.isRegionalPricingEnabled,
      }),
    [withRegionalPricingDisclaimer, saveChanges],
  );

  // Note: we only need to revalidate price, as the other fields don't have cross-field validation
  const revalidatePrice = useCallback(() => {
    void trigger('price');
  }, [trigger]);

  const isCreating = isSubmitting || isCreatePending;

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

      <PriceCheckProductCreationWarning />

      <NewRegionalPricingBanner universeId={universeId} type='developerproduct' enabled />

      <ThumbnailImageUploader onChange={handleFileChange} imageType={['jpg', 'png', 'bmp']} />

      <section className='flex flex-col gap-xxlarge max-width-[678px]'>
        <h2 className='text-heading-small large:text-heading-medium margin-none'>
          {translate('Heading.ProductDetails')}
        </h2>

        <NameTextField register={register} label={translate('Label.Name')} />

        <DescriptionTextField register={register} label={translate('Label.Description')} />

        <PriceTextField
          register={register}
          universeId={universeId}
          label={translate('Label.DefaultPrice')}
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
              disabled={!isDirty || !isValid || isCreating}
              loading={isCreating}>
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

function CreateDeveloperProductFormContainer(props: Props) {
  const { universeId } = props;

  const methods = useForm<ConfigureDeveloperProductFormV2Values>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      price: null,
      isForSale: null, // Not used for this form.
      file: null, // use null as a placeholder for whether file is NOT changed
      isRegionalPricingEnabled: true, // default to true if eligible
      categoryName: null,
    },
  });

  return (
    <FormProvider {...methods}>
      <CreateDeveloperProductFormV2 {...props} />

      <DeveloperProductRegionalPricingDisclaimerModal universeId={universeId} page='/create' />
    </FormProvider>
  );
}

export default CreateDeveloperProductFormContainer;
