import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import type {
  Money,
  RevShareStatModel,
  PurchaseRevSharePayout,
} from '@rbx/client-developer-subscriptions-api/v1';
import { CurrencyType, FailureReason } from '@rbx/client-developer-subscriptions-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Link, Typography, useMediaQuery, useSnackbar, Alert } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import experienceSubscriptionsClient from '@modules/clients/experienceSubscriptions';
import { getResponseFromError } from '@modules/clients/utils';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { ROBLOX_COMMUNITY_STANDARDS } from '@modules/miscellaneous/common/constants/linkConstants';
import FormMode from '@modules/miscellaneous/common/enums/FormMode';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import type { CreateSubscriptionFormType } from '../../constants/CreateSubscriptionRegisterConstants';
import {
  CreateSubscriptionRegisterOptions,
  CreateSubscriptionFormDefaultValue,
  CreateSubscriptionProductTypeByFormValue,
  MinimumRobuxPriceForSubscription,
  DeveloperSharePercentageForRobuxSubscriptions,
} from '../../constants/CreateSubscriptionRegisterConstants';
import parseExperienceSubscriptionErrorCode from '../../utils/parseExperienceSubscriptionErrorCode';
import useSubscriptionFormStyles from '../ExperienceSubscription.styles';
import ExperienceSubscriptionDialog from '../ExperienceSubscriptionDialog';
import RevshareCalculationDemo from './RevShareCalculationDemo';
import CreateSubscriptionFormFooter from './ui/CreateSubscriptionFormFooter';
// Form UI Components
import CreateSubscriptionHeader from './ui/CreateSubscriptionHeader';
import CreateSubscriptionInFiatRobuxFormBody from './ui/CreateSubscriptionInFiatRobuxFormBody';

type TCreateExperienceSubscriptionFormProps = {
  usedSubscriptionNames: string[];
  priceTierMap?: Record<string, Money>;
  revshareStatModelMap?: Record<string, RevShareStatModel>;
  canAccessExperienceSubscription?: boolean;
};

function getCurrencyType(currencyType: string): CurrencyType {
  if (currencyType === 'robux') {
    return CurrencyType.Robux;
  }
  return CurrencyType.Fiat;
}

// oxlint-disable-next-line react/react-compiler -- pre-existing: useForm from react-hook-form is flagged as incompatible
function CreateExperienceSubscriptionForm({
  usedSubscriptionNames,
  priceTierMap,
  revshareStatModelMap,
  canAccessExperienceSubscription = true,
}: TCreateExperienceSubscriptionFormProps) {
  const {
    classes: {
      formContainer,
      createProductInfoText,
      createButton,
      errorMessageStyle,
      inputFormPadding,
      buttonContainerStyle,
      revshareCard,
      bottomGrid,
    },
  } = useSubscriptionFormStyles();
  const { user } = useAuthentication();
  const { translate } = useTranslation();
  const router = useRouter();
  const { error } = useMetricsMonitoring();
  const { isLoadingGame, gameDetails } = useCurrentGame();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const shouldFoldRevshareDemoInCreationForm = useMediaQuery((theme) =>
    theme.breakpoints.down('XLarge'),
  );

  const {
    register,
    formState: { isSubmitting, errors, isValid, isValidating },
    handleSubmit,
    control,
    setValue,
    setError,
    watch,
    trigger,
  } = useForm<CreateSubscriptionFormType>({
    mode: FormMode.OnTouched,
    reValidateMode: FormMode.OnChange,
    defaultValues: {
      name: CreateSubscriptionFormDefaultValue.name,
      description: CreateSubscriptionFormDefaultValue.description,
      file: CreateSubscriptionFormDefaultValue.file,
      productType: CreateSubscriptionFormDefaultValue.productType,
      price: CreateSubscriptionFormDefaultValue.price,
      period: CreateSubscriptionFormDefaultValue.period,
      currencyType: CreateSubscriptionFormDefaultValue.currencyType,
      priceInRobux: CreateSubscriptionFormDefaultValue.priceInRobux,
      isRegionalPricingEnabled: CreateSubscriptionFormDefaultValue.isRegionalPricingEnabled,
    },
    shouldUnregister: false,
  });
  const [subscriptionErrorMsg, setSubscriptionErrorMsg] = useState<string>('');
  const [isCreateDialogShown, setIsCreateDialogShown] = useState<boolean>(false);
  const [webRevSharePayout, setWebRevSharePayout] = useState<PurchaseRevSharePayout | undefined>(
    undefined,
  );
  const [appStoreRevSharePayout, setAppStoreRevSharePayout] = useState<
    PurchaseRevSharePayout | undefined
  >(undefined);

  const watchedPriceInRobux = watch('priceInRobux');
  const watchedCurrencyType = watch('currencyType');
  const isFiatBlockedByVerification =
    !canAccessExperienceSubscription && watchedCurrencyType === 'fiat';

  useEffect(() => {
    register('file', CreateSubscriptionRegisterOptions.file);
  }, [register]);

  useEffect(() => {
    if (!watchedCurrencyType) {
      setValue('currencyType', 'robux');
    }
  }, [setValue, watchedCurrencyType]);

  // Trigger price validation each time currencyType changes
  useEffect(() => {
    void trigger('price');
    void trigger('priceInRobux');
  }, [watchedCurrencyType, trigger]);

  const computeRobuxRevSharePayout = useCallback(
    (priceInRobux: number): PurchaseRevSharePayout | undefined => {
      if (!priceInRobux || priceInRobux < MinimumRobuxPriceForSubscription) {
        return undefined;
      }

      const firstPurchasePayout = Math.floor(
        priceInRobux * DeveloperSharePercentageForRobuxSubscriptions,
      );
      const renewalPayout = Math.floor(
        priceInRobux * DeveloperSharePercentageForRobuxSubscriptions,
      );

      return {
        priceTier: {
          units: priceInRobux,
          cents: 0,
        },
        firstPurchasePayoutInRobux: firstPurchasePayout,
        renewalPayoutAmountInRobux: renewalPayout,
      };
    },
    [],
  );

  const handleRobuxPriceChange = useCallback(
    (priceInRobux: number) => {
      const payout = computeRobuxRevSharePayout(priceInRobux);
      if (payout) {
        setWebRevSharePayout(payout);
        setAppStoreRevSharePayout(payout);
      } else {
        setWebRevSharePayout(undefined);
        setAppStoreRevSharePayout(undefined);
      }
    },
    [computeRobuxRevSharePayout],
  );

  useEffect(() => {
    if (watchedCurrencyType === 'robux') {
      if (watchedPriceInRobux && watchedPriceInRobux >= MinimumRobuxPriceForSubscription) {
        handleRobuxPriceChange(watchedPriceInRobux);
      } else {
        setWebRevSharePayout(undefined);
        setAppStoreRevSharePayout(undefined);
      }
    } else if (watchedCurrencyType === 'fiat') {
      setWebRevSharePayout(undefined);
      setAppStoreRevSharePayout(undefined);
    }
  }, [watchedPriceInRobux, watchedCurrencyType, handleRobuxPriceChange]);

  const showSnackbar = useCallback(
    (msg: string, isSuccess: boolean) => {
      enqueue({
        children: <Alert severity={isSuccess ? 'success' : 'error'}>{msg}</Alert>,
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: closeSnackbar,
      });
    },
    [enqueue, closeSnackbar],
  );

  const createNewExperienceSubscription = useCallback(
    async (universeId: number, data: CreateSubscriptionFormType) => {
      try {
        const currencyType = getCurrencyType(data.currencyType);
        const productType = CreateSubscriptionProductTypeByFormValue[data.productType];
        if (productType === undefined) {
          throw new Error(`Invalid product type: ${data.productType}`);
        }
        const { developerSubscription } =
          await experienceSubscriptionsClient.createExperienceSubscription(
            universeId,
            data.name.trim(),
            data.description,
            productType,
            currencyType === CurrencyType.Fiat && data.price !== '' ? data.price : null,
            currencyType,
            currencyType === CurrencyType.Robux ? data.priceInRobux : null,
            currencyType === CurrencyType.Robux,
          );
        if (developerSubscription && developerSubscription?.id) {
          return developerSubscription?.id;
        }
      } catch (e) {
        const errorResponse = getResponseFromError(e);
        const { errorKey, errorObject } = await parseExperienceSubscriptionErrorCode(errorResponse);

        setSubscriptionErrorMsg(errorKey);
        error(e instanceof Error ? e.message : String(e));

        if (
          errorObject?.failureReason === FailureReason.ProductContentModerated &&
          errorObject.details
        ) {
          const moderatedName = errorObject.details.name ?? data.name;
          const moderatedDescription = errorObject.details.description ?? data.description;

          setValue('name', moderatedName);
          setValue('description', moderatedDescription);

          if (moderatedName !== data.name) {
            setError('name', { type: 'manual', message: 'Error.InputTextModerated' });
          }
          if (moderatedDescription !== data.description) {
            setError('description', { type: 'manual', message: 'Error.InputTextModerated' });
          }
        }

        return 0;
      }
      return 0;
    },
    [error, setError, setValue],
  );

  const uploadImage = useCallback(
    async (file: File, experienceSubscriptionId: string): Promise<[boolean, string]> => {
      try {
        const product = await experienceSubscriptionsClient.getExperienceSubscription(
          gameDetails?.id ?? 0,
          experienceSubscriptionId,
        );
        if (product.id !== undefined) {
          const response = await experienceSubscriptionsClient.uploadImage(
            gameDetails?.id ?? 0,
            experienceSubscriptionId,
            user?.id ?? 0,
            file,
          );
          if (response.status) {
            return [true, ''];
          }
        }
      } catch (e) {
        const errorResponse = getResponseFromError(e);
        const { errorKey } = await parseExperienceSubscriptionErrorCode(errorResponse);
        return [
          false,
          translate(errorKey === 'Error.FileTooLarge' ? errorKey : 'Error.UploadImageFailure'),
        ];
      }
      return [false, translate('Error.UploadImageFailure')];
    },
    [user?.id, gameDetails?.id, translate],
  );

  const communityStandardsLink = useCallback(
    (chunks: React.ReactNode) => (
      <Link href={ROBLOX_COMMUNITY_STANDARDS} target='_blank' color='inherit' underline='always'>
        {chunks}
      </Link>
    ),
    [],
  );

  // add enqueue and uploadImage as callback args
  const handleFormSubmit: SubmitHandler<CreateSubscriptionFormType> = useCallback(
    async (data) => {
      setSubscriptionErrorMsg('');
      if (!isLoadingGame && gameDetails && gameDetails.id) {
        const experienceSubscriptionId = await createNewExperienceSubscription(
          gameDetails.id,
          data,
        );

        if (experienceSubscriptionId) {
          let imageUploadSuccess = true;
          let errorMessage = '';
          if (data.file !== null && data.file !== undefined) {
            [imageUploadSuccess, errorMessage] = await uploadImage(
              data.file,
              experienceSubscriptionId,
            );
          }

          await queryClient.invalidateQueries({
            queryKey: ['universes', gameDetails.id, 'subscriptions'],
          });

          await router.push(
            `/dashboard/creations/experiences/${gameDetails.id}/associated-items?activeTab=Subscription`,
          );

          const creationStatusMessage = imageUploadSuccess
            ? translate('Message.SubscriptionCreationSuccess')
            : errorMessage;

          showSnackbar(creationStatusMessage, imageUploadSuccess);
        }
        setIsCreateDialogShown(false);
        return;
      }
      void router.push('/dashboard/creations');
    },
    [
      isLoadingGame,
      gameDetails,
      createNewExperienceSubscription,
      translate,
      showSnackbar,
      uploadImage,
      queryClient,
      router,
    ],
  );

  const handleFileChange = useCallback(
    (file: File | null) => {
      setValue('file', file, { shouldValidate: true });
    },
    [setValue],
  );

  const handleFormCancel = useCallback(() => {
    void router.push(
      `/dashboard/creations/experiences/${String(router.query.id)}/associated-items?activeTab=Subscription`,
    );
  }, [router]);

  const revshareStatDemo = useMemo(() => {
    return (
      <RevshareCalculationDemo
        webRevSharePayout={webRevSharePayout}
        appStoreRevSharePayout={appStoreRevSharePayout}
        isRobuxMode={watchedCurrencyType === 'robux'}
      />
    );
  }, [webRevSharePayout, appStoreRevSharePayout, watchedCurrencyType]);

  const renderRevShareCalculationSelectedPrice = useCallback(
    (priceTierKey: string) => {
      const revshareModel = revshareStatModelMap && revshareStatModelMap[priceTierKey];
      setWebRevSharePayout(revshareModel?.webRevSharePayout);
      setAppStoreRevSharePayout(revshareModel?.appStoreRevSharePayout);
    },
    [revshareStatModelMap],
  );

  return (
    <>
      <Grid container item direction='row' alignItems='stretch' classes={{ root: formContainer }}>
        <CreateSubscriptionHeader createProductInfoText={createProductInfoText} />
        <CreateSubscriptionInFiatRobuxFormBody
          control={control}
          errors={errors}
          usedSubscriptionNames={usedSubscriptionNames}
          priceTierMap={priceTierMap}
          inputFormPadding={inputFormPadding}
          revshareCard={revshareCard}
          bottomGrid={bottomGrid}
          shouldFoldRevshareDemoInCreationForm={shouldFoldRevshareDemoInCreationForm}
          revshareStatDemo={revshareStatDemo}
          onFileChange={handleFileChange}
          onPriceSelect={renderRevShareCalculationSelectedPrice}
          onRobuxPriceChange={handleRobuxPriceChange}
          canAccessExperienceSubscription={canAccessExperienceSubscription}
        />
      </Grid>

      <CreateSubscriptionFormFooter
        buttonContainerStyle={buttonContainerStyle}
        createButton={createButton}
        errorMessageStyle={errorMessageStyle}
        isSubmitting={isSubmitting}
        isValidating={isValidating}
        isValid={isValid}
        subscriptionErrorMsg={subscriptionErrorMsg}
        onCancel={handleFormCancel}
        onCreateClick={() => setIsCreateDialogShown(true)}
        communityStandardsLink={communityStandardsLink}
        isFiatBlockedByVerification={isFiatBlockedByVerification}
      />
      <ExperienceSubscriptionDialog
        isOpen={isCreateDialogShown}
        onConfirm={handleSubmit(handleFormSubmit)}
        onCancel={() => setIsCreateDialogShown(false)}
        title='Heading.AlmostDone'
        content={
          <>
            <Typography variant='body1'>
              {translate('Message.SubscriptionEditLimitation')}
            </Typography>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li>
                <Typography variant='body1'>{translate('Label.Image')}</Typography>
              </li>
              <li>
                <Typography variant='body1'>{translate('Label.Description')}</Typography>
              </li>
              <li>
                <Typography variant='body1'>{translate('Label.PaymentOption')}</Typography>
              </li>
            </ul>
          </>
        }
        confirmText='Action.Continue'
        cancelText='Action.Cancel'
        loading={isSubmitting}
      />
    </>
  );
}

export default withTranslation(CreateExperienceSubscriptionForm, [
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.ExperienceSubscriptions,
  TranslationNamespace.Error,
  TranslationNamespace.RegionalPricing,
]);
