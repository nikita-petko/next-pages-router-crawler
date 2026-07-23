import { Fragment, useState, useCallback, useEffect, useMemo } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Grid, Link, Typography, useMediaQuery, useSnackbar, Alert } from '@rbx/ui';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ROBLOX_COMMUNITY_STANDARDS } from '@modules/miscellaneous/common/constants/linkConstants';
import FormMode from '@modules/miscellaneous/common/enums/FormMode';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import Router from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { experienceSubscriptionsClient } from '@modules/clients';
import { useAuthentication } from '@modules/authentication/providers';
import {
  CurrencyType,
  DeveloperSubscriptionProductType,
  FailureReason,
  Money,
  RevShareStatModel,
  PurchaseRevSharePayout,
} from '@rbx/clients/developerSubscriptionsApi';
import { getResponseFromError } from '@modules/clients/utils';
import useDevSubsInRobuxGate from '../../hooks/useDevSubsInRobuxGate';
import useSubscriptionFormStyles from '../ExperienceSubscription.styles';
import {
  CreateSubscriptionRegisterOptions,
  CreateSubscriptionFormDefaultValue,
  CreateSubscriptionFormType,
  MinimumRobuxPriceForSubscription,
  DeveloperSharePercentageForRobuxSubscriptions,
} from '../../constants/CreateSubscriptionRegisterConstants';
import ExperienceSubscriptionDialog from '../ExperienceSubscriptionDialog';
import parseExperienceSubscriptionErrorCode from '../../utils/parseExperienceSubscriptionErrorCode';
import RevshareCalculationDemo from './RevShareCalculationDemo';

// Form UI Components
import CreateSubscriptionHeader from './ui/CreateSubscriptionHeader';
import CreateSubscriptionInFiatFormBody from './ui/CreateSubscriptionInFiatFormBody';
import CreateSubscriptionFormFooter from './ui/CreateSubscriptionFormFooter';
import CreateSubscriptionInFiatRobuxFormBody from './ui/CreateSubscriptionInFiatRobuxFormBody';

type TCreateExperienceSubscriptionFormProps = {
  usedSubscriptionNames: string[];
  priceTierMap?: Record<string, Money>;
  revshareStatModelMap?: Record<string, RevShareStatModel>;
  canAccessExperienceSubscription?: boolean;
};

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
  const { error } = useMetricsMonitoring();
  const { isLoadingGame, gameDetails } = useCurrentGame();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const shouldAdditionallyShowDevSubsInRobux = useDevSubsInRobuxGate();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const isMdView = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const shouldFoldRevshareDemoInCreationForm = isCompactView || isMdView;

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
  const [subscriptionBackendErrorMessage, setSubscriptionBackendErrorMessage] =
    useState<string>('');
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
    if (shouldAdditionallyShowDevSubsInRobux && !watchedCurrencyType) {
      setValue('currencyType', 'robux');
    }
  }, [shouldAdditionallyShowDevSubsInRobux, setValue, watchedCurrencyType]);

  // Trigger price validation each time currencyType changes
  useEffect(() => {
    trigger('price');
    trigger('priceInRobux');
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

  const getCurrencyType = (currencyType: string): CurrencyType => {
    if (currencyType === 'robux') {
      return CurrencyType.Robux;
    }
    return CurrencyType.Fiat;
  };

  const createNewExperienceSubscription = useCallback(
    async (universeId: number, data: CreateSubscriptionFormType) => {
      try {
        const currencyType = getCurrencyType(data.currencyType);
        const { developerSubscription } =
          await experienceSubscriptionsClient.createExperienceSubscription(
            universeId,
            data.name.trim(),
            data.description,
            parseInt(data.productType, 10) as DeveloperSubscriptionProductType,
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
        const { errorKey, serverErrorMessage, errorObject } =
          await parseExperienceSubscriptionErrorCode(errorResponse);

        setSubscriptionErrorMsg(errorKey);
        setSubscriptionBackendErrorMessage(serverErrorMessage?.trim() ?? '');
        error(e as string);

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
    async (
      data: CreateSubscriptionFormType,
      experienceSubscriptionId: string,
    ): Promise<[boolean, string]> => {
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
            data.file as Blob,
          );
          if (response.status) {
            return [true, ''];
          }
        }
      } catch {
        return [false, translate('Error.UploadImageFailure')];
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
      setSubscriptionBackendErrorMessage('');
      if (!isLoadingGame && gameDetails && gameDetails.id) {
        const experienceSubscriptionId = await createNewExperienceSubscription(
          gameDetails.id,
          data,
        );

        if (experienceSubscriptionId) {
          let imageUploadSuccess = true;
          let errorMessage = '';
          if (data.file !== null && data.file !== undefined) {
            [imageUploadSuccess, errorMessage] = await uploadImage(data, experienceSubscriptionId);
          }

          await queryClient.invalidateQueries({
            queryKey: ['universes', gameDetails.id, 'subscriptions'],
          });

          await Router.push(
            `/dashboard/creations/experiences/${gameDetails.id}/associated-items?activeTab=Subscription`,
          );

          const creationStatusMessage = imageUploadSuccess
            ? translate('Message.SubscriptionCreationSuccess')
            : errorMessage;

          showSnackbar(creationStatusMessage, imageUploadSuccess);
        }
        setIsCreateDialogShown(false);
        return Promise.resolve();
      }
      return Router.push('/dashboard/creations');
    },
    [
      isLoadingGame,
      gameDetails,
      createNewExperienceSubscription,
      translate,
      showSnackbar,
      uploadImage,
      queryClient,
    ],
  );

  const handleFileChange = useCallback(
    (file: File | null) => {
      setValue('file', file, { shouldValidate: true });
    },
    [setValue],
  );

  const handleFormCancel = useCallback(() => {
    Router.push(
      `/dashboard/creations/experiences/${Router.query.id}/associated-items?activeTab=Subscription`,
    );
  }, []);

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
    <Fragment>
      <Grid container item direction='row' alignItems='stretch' classes={{ root: formContainer }}>
        <CreateSubscriptionHeader createProductInfoText={createProductInfoText} />
        {shouldAdditionallyShowDevSubsInRobux ? (
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
        ) : (
          <CreateSubscriptionInFiatFormBody
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
          />
        )}
      </Grid>

      <CreateSubscriptionFormFooter
        buttonContainerStyle={buttonContainerStyle}
        createButton={createButton}
        errorMessageStyle={errorMessageStyle}
        isSubmitting={isSubmitting}
        isValidating={isValidating}
        isValid={isValid}
        subscriptionErrorMsg={subscriptionErrorMsg}
        subscriptionBackendErrorMessage={subscriptionBackendErrorMessage}
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
          <Fragment>
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
          </Fragment>
        }
        confirmText='Action.Continue'
        cancelText='Action.Cancel'
        loading={isSubmitting}
      />
    </Fragment>
  );
}

export default withTranslation(CreateExperienceSubscriptionForm, [
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.ExperienceSubscriptions,
  TranslationNamespace.Error,
  TranslationNamespace.RegionalPricing,
]);
