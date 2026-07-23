import { useCallback, useEffect, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useForm, Controller, SubmitHandler, FormProvider, useFormContext } from 'react-hook-form';
import {
  Switch,
  Button,
  useSnackbar,
  FormHelperText,
  Dialog,
  DialogTemplate,
  ErrorOutlineOutlinedIcon,
  FormControlLabel,
  StickyFooter,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import passesClient from '@modules/clients/passes';
import { GamePassesGetSalesLimitInfoRequest } from '@rbx/clients/gamePassesHttpService/v1';
import NewRegionalPricingBanner from '@modules/regional-pricing/components/NewRegionalPricingBanner';
import RegionalPricingDisclaimerModal, {
  useRegionalPricingDisclaimer,
} from '@modules/regional-pricing/components/RegionalPricingDisclaimerModal/RegionalPricingDisclaimerModal';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import DisallowPriceChangeInExperimentBanner from '@modules/price-optimization/components/DisallowPriceChangeInExperimentBanner';
import { useUpdateGamePass } from '@modules/passes/queries/useUpdateGamePass';
import ControllerCheckboxWithTooltip from '@modules/monetization-shared/form/ControllerCheckboxWithTooltip';
import type { ConfigureSalesFormValues } from '../form-shared/types';
import RegionalPricesDisplay from './RegionalPricesDisplay';
import { PriceTextField } from './ConfigureSalesFields';

type Props = {
  universeId: number;
  passId: number;
  isForSale: boolean;
  price?: number | null;
  isRegionalPricingEnabled?: boolean;
  isInActivePriceOptimizationExperiment?: boolean;
  isPending?: boolean;
};

const DEFAULT_SALES_LIMIT = 50;

const getPassesUrl = dashboard.getMonetizationPassesUrl;
const getPriceCheckLink = dashboard.getMonetizationDynamicPriceCheckUrl;

const ConfigureSalesForm = ({
  universeId,
  passId,
  isForSale,
  price,
  isInActivePriceOptimizationExperiment = false,
  isPending,
}: Props) => {
  const { translate, translateHTML } = useTranslation();
  const router = useRouter();

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
  const [saleLimitNum, setSaleLimitNum] = useState<number>(DEFAULT_SALES_LIMIT);
  const [isLimitReachedDialogShown, setIsLimitReachedDialogShown] = useState<boolean>(false);

  const spyIsForSale = watch('isForSale');

  const passesLink = getPassesUrl(universeId);

  const { enqueue } = useSnackbar();
  const showSuccessToast = useCallback(() => {
    enqueue(
      { message: translate('Message.PassConfigureSuccess'), autoHide: true },
      (reason) => reason === 'timeout',
    );
  }, [enqueue, translate]);

  const { mutateAsync: updateGamePass, isPending: isUpdateGamePassPending } = useUpdateGamePass(
    { universeId, gamePassId: passId },
    { onSuccess: showSuccessToast },
  );

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
      const currentIsForSale = e.target.checked;

      setValue('isForSale', currentIsForSale, { shouldDirty: true });

      if (currentIsForSale) {
        const request: GamePassesGetSalesLimitInfoRequest = { universeid: universeId };
        try {
          if (!isForSale) {
            const { salesLimit, hasLimitBeenReached } =
              await passesClient.getPassSalesLimitInfo(request);
            setSaleLimitNum(salesLimit ?? DEFAULT_SALES_LIMIT);
            if (hasLimitBeenReached) {
              setIsLimitReachedDialogShown(true);
            }
          }
        } catch {
          setErrorMessage(translate('Error.PassConfigureGeneralError'));
        }
        setValue('price', price ?? null, { shouldDirty: true });
      }
      await trigger('price');
    },
    [setValue, trigger, universeId, price, isForSale, translate],
  );

  // Note: we only need to revalidate price, as the other fields don't have cross-field validation
  const revalidatePrice = useCallback(() => {
    trigger('price');
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
          disabled={isSubmitDisabled || isPending || isUpdateGamePassPending}
          loading={isSubmitting || isPending || isUpdateGamePassPending}>
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
          disabled: isSubmitDisabled || isPending || isUpdateGamePassPending,
          loading: isSubmitting || isPending || isUpdateGamePassPending,
          label: translate('Action.ConfigurePass'),
        }}
        secondary={{
          type: 'button',
          variant: 'outlined',
          color: 'primary',
          size: 'large',
          component: NextLink,
          disabled: isSubmitting || isPending || isUpdateGamePassPending,
          label: translate('Action.Cancel'),
          href: passesLink,
        }}
      />

      {errorMessage && (
        <FormHelperText error className='text-caption-medium content-system-alert padding-x-small'>
          {errorMessage}
        </FormHelperText>
      )}

      <Dialog open={isLimitReachedDialogShown} data-testid='sales-limit-reached-modal'>
        <DialogTemplate
          cancelText={translate('Action.CancelSale')}
          color='primaryBrand'
          confirmText={translate('Action.ManagePasses')}
          content={translate('Description.SalesLimitReached', { number: saleLimitNum.toString() })}
          onCancel={() => {
            setIsLimitReachedDialogShown(false);
            reset();
          }}
          onConfirm={() => {
            setIsLimitReachedDialogShown(false);
            router.push(passesLink);
          }}
          title={translate('Heading.SalesLimitReached')}
          variant='alert'
        />
      </Dialog>
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
