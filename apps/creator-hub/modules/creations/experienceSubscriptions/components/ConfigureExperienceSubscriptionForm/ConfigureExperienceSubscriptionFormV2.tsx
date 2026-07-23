import { useState, useEffect, useCallback, useMemo } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import { experienceSubscriptionsClient, GetExperienceSubscriptionResponse } from '@modules/clients';
import { useAuthentication } from '@modules/authentication/providers';
import { useTranslation } from '@rbx/intl';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { Alert, Link, useMediaQuery, useSnackbar } from '@rbx/ui';
import { FormMode } from '@modules/miscellaneous/common';
import {
  FailureReason,
  RevShareStatModel,
  PurchaseRevSharePayout,
  Money,
  CurrencyType,
} from '@rbx/clients/developerSubscriptionsApi';
import {
  ROBLOX_COMMUNITY_STANDARDS,
  SUBSCRIPTION_TERMS_OF_USE,
} from '@modules/miscellaneous/common/constants/linkConstants';
import { getResponseFromError } from '@modules/clients/utils';
import useDevSubsInRobuxGate from '../../hooks/useDevSubsInRobuxGate';
import {
  CreateSubscriptionFormType,
  MinimumRobuxPriceForSubscription,
  DeveloperSharePercentageForRobuxSubscriptions,
} from '../../constants/CreateSubscriptionRegisterConstants';
import useSubscriptionFormStyles from '../ExperienceSubscription.styles';
import { ConfigureSubscriptionRegisterOptions } from '../../constants/ConfigureSubscriptionRegisterOptions';
import parseExperienceSubscriptionErrorCode from '../../utils/parseExperienceSubscriptionErrorCode';
import RevshareCalculationDemo from '../CreateExperienceSubscriptionForm/RevShareCalculationDemo';
import ConfigureSubscriptionInFiatFormV2UI from './ui/ConfigureSubscriptionInFiatFormV2UI';
import ConfigureExperienceFiatRobuxSubscriptionFormUI from './ui/ConfigureExperienceFiatRobuxSubscriptionFormUI';

type TConfigureExperienceSubscriptionFormProps = {
  experienceSubscriptionDetailsInfo: GetExperienceSubscriptionResponse;
  priceTierMap?: Record<string, Money>;
  revshareStatModelMap?: Record<string, RevShareStatModel>;
  // eslint-disable-next-line react/no-unused-prop-types -- Used by parent component for future functionality
  refreshData?: () => void;
  canAccessExperienceSubscription?: boolean;
};

// TODO: (@kevinli 08172023): SUBS-1845, breakup component into smaller pieces
const ConfigureExperienceSubscriptionFormV2 = ({
  experienceSubscriptionDetailsInfo,
  priceTierMap,
  revshareStatModelMap,
  canAccessExperienceSubscription = true,
}: TConfigureExperienceSubscriptionFormProps) => {
  const {
    classes: {
      formContainer,
      createButton,
      errorMessageStyle,
      inputFormPadding,
      buttonContainerStyle,
      copyIconStyle,
      revshareCard,
      bottomGrid,
    },
  } = useSubscriptionFormStyles();
  const { user } = useAuthentication();
  const { translate, translateHTML } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoadingGame, gameDetails } = useCurrentGame();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const shouldAllowRobuxSubscriptions = useDevSubsInRobuxGate();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const shouldFoldRevshareDemoInConfigurationForm = useMediaQuery((theme) =>
    theme.breakpoints.down('Large'),
  );
  const getInitialCurrencyType = useMemo(() => {
    if (
      experienceSubscriptionDetailsInfo.currencyType !== undefined &&
      experienceSubscriptionDetailsInfo.currencyType === CurrencyType.Robux
    ) {
      return 'robux';
    }
    return 'fiat';
  }, [experienceSubscriptionDetailsInfo]);

  const getInitialPriceInRobux = useMemo(() => {
    return experienceSubscriptionDetailsInfo.priceInRobux ?? 0;
  }, [experienceSubscriptionDetailsInfo]);

  const { register, formState, handleSubmit, control, setValue, watch, setError } =
    useForm<CreateSubscriptionFormType>({
      mode: FormMode.OnTouched,
      reValidateMode: FormMode.OnChange,
      defaultValues: {
        name: experienceSubscriptionDetailsInfo.name ?? undefined,
        description: experienceSubscriptionDetailsInfo.description ?? undefined,
        productType: (experienceSubscriptionDetailsInfo.productType ?? '').toString(),
        price: '',
        period: (experienceSubscriptionDetailsInfo.periodType ?? '').toString(),
        file: null,
        currencyType: getInitialCurrencyType,
        priceInRobux: getInitialPriceInRobux,
        isRegionalPricingEnabled:
          experienceSubscriptionDetailsInfo.isRegionalPricingEnabled ?? false,
      },
      shouldUnregister: true,
    });
  const { isSubmitting, errors, isValid, isDirty, isValidating } = formState;

  const [subscriptionErrorMsg, setSubscriptionErrorMsg] = useState<string>('');
  const [subscriptionBackendErrorMessage, setSubscriptionBackendErrorMessage] =
    useState<string>('');
  const [isConfigureDialogShown, setIsConfigureDialogShown] = useState(false);
  const [webRevSharePayout, setWebRevSharePayout] = useState<PurchaseRevSharePayout | undefined>(
    undefined,
  );
  const [appStoreRevSharePayout, setAppStoreRevSharePayout] = useState<
    PurchaseRevSharePayout | undefined
  >(undefined);

  const [canUpdateDescription, setCanUpdateDescription] = useState(false);

  useEffect(() => {
    setCanUpdateDescription(true);
  }, []);

  // ! (@kevinli 02/12/23) for details see:
  // ! https://github.com/react-hook-form/react-hook-form/issues/4704
  // ! doesn't seem like there is a good solution right now when a field
  // ! need to be `File`, which extends `Object`, than waiting for library
  // ! level typing fixes
  const inputDescription = watch('description');
  const inputFile = watch('file');
  const watchedCurrencyType = watch('currencyType');
  const watchedPriceInRobux = watch('priceInRobux');
  const watchedPrice = watch('price');

  const displayPrice = useMemo(() => {
    if (
      typeof priceTierMap !== 'undefined' &&
      typeof experienceSubscriptionDetailsInfo.basePriceId !== 'undefined' &&
      experienceSubscriptionDetailsInfo.basePriceId !== null
    ) {
      const priceData = priceTierMap[experienceSubscriptionDetailsInfo.basePriceId];
      if (priceData) {
        return `$${priceData.units}.${priceData.cents}`;
      }
    }
    return '';
  }, [experienceSubscriptionDetailsInfo.basePriceId, priceTierMap]);

  useEffect(() => {
    if (
      typeof experienceSubscriptionDetailsInfo.basePriceId !== 'undefined' &&
      experienceSubscriptionDetailsInfo.basePriceId !== null
    ) {
      setValue('price', experienceSubscriptionDetailsInfo.basePriceId);
    }
  }, [experienceSubscriptionDetailsInfo.basePriceId, setValue]);

  // Set priceInRobux if the subscription uses Robux currency
  useEffect(() => {
    if (
      experienceSubscriptionDetailsInfo.priceInRobux !== undefined &&
      experienceSubscriptionDetailsInfo.priceInRobux !== null &&
      experienceSubscriptionDetailsInfo.priceInRobux > 0
    ) {
      setValue('priceInRobux', experienceSubscriptionDetailsInfo.priceInRobux);
    }
  }, [experienceSubscriptionDetailsInfo.priceInRobux, setValue]);

  // Set isRegionalPricingEnabled from existing subscription details
  useEffect(() => {
    if (experienceSubscriptionDetailsInfo.isRegionalPricingEnabled !== undefined) {
      setValue(
        'isRegionalPricingEnabled',
        experienceSubscriptionDetailsInfo.isRegionalPricingEnabled,
      );
    }
  }, [experienceSubscriptionDetailsInfo.isRegionalPricingEnabled, setValue]);

  const showSnackbar = useCallback(
    (msg: string, isSuccess: boolean) => {
      enqueue({
        children: <Alert severity={isSuccess ? 'success' : 'error'}>{msg}</Alert>,
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHide: true,
        onClose: closeSnackbar,
      });
    },
    [enqueue, closeSnackbar],
  );

  useEffect(() => {
    register('file', ConfigureSubscriptionRegisterOptions.file);
  }, [register]);

  const handleFileChange = useCallback(
    (file: File | null) => {
      setValue('file', file, { shouldValidate: true, shouldDirty: true });
    },
    [setValue],
  );

  const handleFormCancel = useCallback(() => {
    router.push(
      `/dashboard/creations/experiences/${router.query.id}/associated-items?activeTab=Subscription`,
    );
  }, [router]);

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

  const handlePriceSelect = useCallback(
    (priceTierKey: string) => {
      if (!revshareStatModelMap) {
        return;
      }
      const revshareModel = revshareStatModelMap[priceTierKey];
      setWebRevSharePayout(revshareModel?.webRevSharePayout);
      setAppStoreRevSharePayout(revshareModel?.appStoreRevSharePayout);
    },
    [revshareStatModelMap],
  );

  // Update revshare demo when currency type or robux price changes
  useEffect(() => {
    if (watchedCurrencyType === 'robux') {
      if (watchedPriceInRobux && watchedPriceInRobux >= MinimumRobuxPriceForSubscription) {
        handleRobuxPriceChange(watchedPriceInRobux);
      } else {
        setWebRevSharePayout(undefined);
        setAppStoreRevSharePayout(undefined);
      }
    }
  }, [watchedPriceInRobux, watchedCurrencyType, handleRobuxPriceChange]);

  // Update revshare demo when fiat price is changed
  useEffect(() => {
    if (watchedCurrencyType === 'fiat' && watchedPrice && revshareStatModelMap) {
      if (!shouldAllowRobuxSubscriptions) {
        return;
      }
      handlePriceSelect(watchedPrice);
    }
  }, [
    watchedPrice,
    watchedCurrencyType,
    revshareStatModelMap,
    priceTierMap,
    shouldAllowRobuxSubscriptions,
    handlePriceSelect,
  ]);

  const revshareStatDemo = useMemo(() => {
    return (
      <RevshareCalculationDemo
        webRevSharePayout={webRevSharePayout}
        appStoreRevSharePayout={appStoreRevSharePayout}
        isRobuxMode={watchedCurrencyType === 'robux'}
      />
    );
  }, [webRevSharePayout, appStoreRevSharePayout, watchedCurrencyType]);
  const renderRevShareCalculationSelectedPrice = useCallback(() => {
    if (!revshareStatModelMap || !experienceSubscriptionDetailsInfo?.basePriceId) {
      return null;
    }
    // Since we don't allow price to be changed when updating the subscription. We use the basePriceId that is
    // passed in to render the demo.
    const revshareModel = revshareStatModelMap[experienceSubscriptionDetailsInfo.basePriceId];
    setWebRevSharePayout(revshareModel?.webRevSharePayout);
    setAppStoreRevSharePayout(revshareModel?.appStoreRevSharePayout);
    return null;
  }, [revshareStatModelMap, experienceSubscriptionDetailsInfo]);

  const communityStandardsLink = useCallback(
    (chunks: React.ReactNode) => (
      <Link href={ROBLOX_COMMUNITY_STANDARDS} target='_blank' color='inherit' underline='always'>
        {chunks}
      </Link>
    ),
    [],
  );

  const termsOfUseLink = useCallback(
    (chunks: React.ReactNode) => (
      <Link href={SUBSCRIPTION_TERMS_OF_USE} target='_blank' color='inherit' underline='always'>
        {chunks}
      </Link>
    ),
    [],
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

  const getCurrencyType = (currencyType: string): CurrencyType => {
    if (currencyType === 'robux') {
      return CurrencyType.Robux;
    }
    return CurrencyType.Fiat;
  };

  const updateExperienceSubscription = useCallback(
    async (universeId: number, data: CreateSubscriptionFormType) => {
      let subscriptionUpdateSuccess = true;

      if (
        shouldAllowRobuxSubscriptions ||
        (data.description.length > 0 &&
          data.description !== experienceSubscriptionDetailsInfo.description)
      ) {
        try {
          await experienceSubscriptionsClient.updateExperienceSubscription(
            universeId,
            experienceSubscriptionDetailsInfo.id ?? '0',
            experienceSubscriptionDetailsInfo.imageAssetId ?? 0,
            data.description,
            getCurrencyType(data.currencyType),
            data.currencyType === 'fiat' &&
              data.price !== '' &&
              (data.price !== experienceSubscriptionDetailsInfo.basePriceId ||
                experienceSubscriptionDetailsInfo.currencyType !== CurrencyType.Fiat)
              ? data.price
              : undefined,
            data.priceInRobux !== 0 &&
              data.priceInRobux !== experienceSubscriptionDetailsInfo.priceInRobux
              ? data.priceInRobux
              : undefined,
            data.currencyType === 'robux',
          );
        } catch (e) {
          subscriptionUpdateSuccess = false;
          const errorResponse = getResponseFromError(e);
          const { errorKey, serverErrorMessage, errorObject } =
            await parseExperienceSubscriptionErrorCode(errorResponse);

          setSubscriptionErrorMsg(errorKey);
          setSubscriptionBackendErrorMessage(serverErrorMessage?.trim() ?? '');

          if (
            errorObject?.failureReason === FailureReason.ProductContentModerated &&
            errorObject.details
          ) {
            const moderatedDescription = errorObject.details.description ?? data.description;

            setValue('description', moderatedDescription);

            if (moderatedDescription !== data.description) {
              setError('description', { type: 'manual', message: 'Error.InputTextModerated' });
            }
          }
        }
      }

      return subscriptionUpdateSuccess;
    },
    [experienceSubscriptionDetailsInfo, setError, setValue, shouldAllowRobuxSubscriptions],
  );

  const handleFormSubmit: SubmitHandler<CreateSubscriptionFormType> = useCallback(
    async (data) => {
      setSubscriptionErrorMsg('');
      setSubscriptionBackendErrorMessage('');
      if (!isLoadingGame && gameDetails && gameDetails.id) {
        const experienceSubscriptionId = experienceSubscriptionDetailsInfo.id;

        if (experienceSubscriptionId) {
          let subscriptionUpdateSuccess = true;

          if (canUpdateDescription || shouldAllowRobuxSubscriptions) {
            subscriptionUpdateSuccess = await updateExperienceSubscription(gameDetails.id, data);
          }

          if (!subscriptionUpdateSuccess) {
            setIsConfigureDialogShown(false);
            return Promise.resolve();
          }

          let imageUploadSuccess = true;
          if (data.file !== null && data.file !== undefined) {
            [imageUploadSuccess] = await uploadImage(data, experienceSubscriptionId);
          }

          if (imageUploadSuccess) {
            await queryClient.invalidateQueries({
              queryKey: ['universes', gameDetails.id, 'subscriptions'],
            });

            await router.push(
              `/dashboard/creations/experiences/${gameDetails.id}/associated-items?activeTab=Subscription`,
            );

            showSnackbar(translate('Message.UpdateSubscriptionSuccess'), true);
          }

          setIsConfigureDialogShown(false);
        }
        return Promise.resolve();
      }
      return router.push('/dashboard/creations');
    },
    [
      isLoadingGame,
      gameDetails,
      router,
      queryClient,
      experienceSubscriptionDetailsInfo.id,
      canUpdateDescription,
      updateExperienceSubscription,
      uploadImage,
      showSnackbar,
      translate,
      shouldAllowRobuxSubscriptions,
    ],
  );

  const copyToClipboard = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    navigator.clipboard.writeText(`EXP-${experienceSubscriptionDetailsInfo.id}`);
    showSnackbar(translate('Message.CopiedSubscriptionID'), true);
  };

  if (shouldAllowRobuxSubscriptions) {
    return (
      <ConfigureExperienceFiatRobuxSubscriptionFormUI
        formContainer={formContainer}
        createButton={createButton}
        errorMessageStyle={errorMessageStyle}
        inputFormPadding={inputFormPadding}
        buttonContainerStyle={buttonContainerStyle}
        copyIconStyle={copyIconStyle}
        revshareCard={revshareCard}
        bottomGrid={bottomGrid}
        isCompactView={isCompactView}
        shouldFoldRevshareDemoInConfigurationForm={shouldFoldRevshareDemoInConfigurationForm}
        translate={translate}
        translateHTML={translateHTML}
        experienceSubscriptionDetailsInfo={experienceSubscriptionDetailsInfo}
        control={control}
        errors={errors}
        isSubmitting={isSubmitting}
        isValidating={isValidating}
        isValid={isValid}
        isDirty={isDirty}
        inputDescription={inputDescription}
        inputFile={inputFile}
        watchedCurrencyType={watchedCurrencyType}
        priceTierMap={priceTierMap}
        canUpdateDescription={canUpdateDescription}
        subscriptionErrorMsg={subscriptionErrorMsg}
        subscriptionBackendErrorMessage={subscriptionBackendErrorMessage}
        isConfigureDialogShown={isConfigureDialogShown}
        copyToClipboard={copyToClipboard}
        handleFileChange={handleFileChange}
        handleFormCancel={handleFormCancel}
        renderRevShareCalculationSelectedPrice={renderRevShareCalculationSelectedPrice}
        handleSubmit={handleSubmit}
        handleFormSubmit={handleFormSubmit}
        setIsConfigureDialogShown={setIsConfigureDialogShown}
        communityStandardsLink={communityStandardsLink}
        termsOfUseLink={termsOfUseLink}
        revshareStatDemo={revshareStatDemo}
        onPriceSelect={handlePriceSelect}
        onRobuxPriceChange={handleRobuxPriceChange}
        canAccessExperienceSubscription={canAccessExperienceSubscription}
      />
    );
  }

  return (
    <ConfigureSubscriptionInFiatFormV2UI
      formContainer={formContainer}
      createButton={createButton}
      errorMessageStyle={errorMessageStyle}
      inputFormPadding={inputFormPadding}
      buttonContainerStyle={buttonContainerStyle}
      copyIconStyle={copyIconStyle}
      revshareCard={revshareCard}
      isCompactView={isCompactView}
      shouldFoldRevshareDemoInConfigurationForm={shouldFoldRevshareDemoInConfigurationForm}
      translate={translate}
      translateHTML={translateHTML}
      experienceSubscriptionDetailsInfo={experienceSubscriptionDetailsInfo}
      control={control}
      errors={errors}
      isSubmitting={isSubmitting}
      isValidating={isValidating}
      isValid={isValid}
      isDirty={isDirty}
      inputDescription={inputDescription}
      inputFile={inputFile}
      canUpdateDescription={canUpdateDescription}
      subscriptionErrorMsg={subscriptionErrorMsg}
      subscriptionBackendErrorMessage={subscriptionBackendErrorMessage}
      isConfigureDialogShown={isConfigureDialogShown}
      copyToClipboard={copyToClipboard}
      handleFileChange={handleFileChange}
      handleFormCancel={handleFormCancel}
      renderRevShareCalculationSelectedPrice={renderRevShareCalculationSelectedPrice}
      handleSubmit={handleSubmit}
      handleFormSubmit={handleFormSubmit}
      setIsConfigureDialogShown={setIsConfigureDialogShown}
      communityStandardsLink={communityStandardsLink}
      termsOfUseLink={termsOfUseLink}
      revshareStatDemo={revshareStatDemo}
      displayPrice={displayPrice}
    />
  );
};

export default ConfigureExperienceSubscriptionFormV2;
