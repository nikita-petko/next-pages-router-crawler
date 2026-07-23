import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import type {
  RevShareStatModel,
  PurchaseRevSharePayout,
  Money,
} from '@rbx/client-developer-subscriptions-api/v1';
import { FailureReason, CurrencyType } from '@rbx/client-developer-subscriptions-api/v1';
import { useTranslation } from '@rbx/intl';
import { Alert, Link, useMediaQuery, useSnackbar } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import type { GetExperienceSubscriptionResponse } from '@modules/clients/experienceSubscriptions';
import experienceSubscriptionsClient from '@modules/clients/experienceSubscriptions';
import { getResponseFromError } from '@modules/clients/utils';
import { FormMode } from '@modules/miscellaneous/common';
import {
  ROBLOX_COMMUNITY_STANDARDS,
  SUBSCRIPTION_TERMS_OF_USE,
} from '@modules/miscellaneous/common/constants/linkConstants';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { ConfigureSubscriptionRegisterOptions } from '../../constants/ConfigureSubscriptionRegisterOptions';
import type { CreateSubscriptionFormType } from '../../constants/CreateSubscriptionRegisterConstants';
import {
  MinimumRobuxPriceForSubscription,
  DeveloperSharePercentageForRobuxSubscriptions,
} from '../../constants/CreateSubscriptionRegisterConstants';
import getPriceChangeCooldownErrorArgs from '../../utils/getPriceChangeCooldownErrorArgs';
import parseExperienceSubscriptionErrorCode from '../../utils/parseExperienceSubscriptionErrorCode';
import RevshareCalculationDemo from '../CreateExperienceSubscriptionForm/RevShareCalculationDemo';
import useSubscriptionFormStyles from '../ExperienceSubscription.styles';
import ConfigureExperienceFiatRobuxSubscriptionFormUI from './ui/ConfigureExperienceFiatRobuxSubscriptionFormUI';

type TConfigureExperienceSubscriptionFormProps = {
  experienceSubscriptionDetailsInfo: GetExperienceSubscriptionResponse;
  priceTierMap?: Record<string, Money>;
  revshareStatModelMap?: Record<string, RevShareStatModel>;
  refreshData?: () => void;
  canAccessExperienceSubscription?: boolean;
};

function getCurrencyType(currencyType: string): CurrencyType {
  if (currencyType === 'robux') {
    return CurrencyType.Robux;
  }
  return CurrencyType.Fiat;
}

// TODO: (@kevinli 08172023): SUBS-1845, breakup component into smaller pieces
// oxlint-disable-next-line react/react-compiler -- pre-existing: useForm from react-hook-form is flagged as incompatible
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
  const [subscriptionErrorArgs, setSubscriptionErrorArgs] = useState<
    { [key: string]: string } | undefined
  >(undefined);
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
    void router.push(
      `/dashboard/creations/experiences/${String(router.query.id)}/associated-items?activeTab=Subscription`,
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
      handlePriceSelect(watchedPrice);
    }
  }, [watchedPrice, watchedCurrencyType, revshareStatModelMap, priceTierMap, handlePriceSelect]);

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

  const updateExperienceSubscription = useCallback(
    async (universeId: number, data: CreateSubscriptionFormType) => {
      let subscriptionUpdateSuccess = true;

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
        const { errorKey, errorObject } = await parseExperienceSubscriptionErrorCode(errorResponse);

        setSubscriptionErrorMsg(errorKey);
        setSubscriptionErrorArgs(
          errorObject?.failureReason === FailureReason.PriceChangeCooldown
            ? getPriceChangeCooldownErrorArgs(errorObject.details)
            : undefined,
        );

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

      return subscriptionUpdateSuccess;
    },
    [experienceSubscriptionDetailsInfo, setError, setValue],
  );

  const handleFormSubmit: SubmitHandler<CreateSubscriptionFormType> = useCallback(
    async (data) => {
      setSubscriptionErrorMsg('');
      setSubscriptionErrorArgs(undefined);
      if (!isLoadingGame && gameDetails && gameDetails.id) {
        const experienceSubscriptionId = experienceSubscriptionDetailsInfo.id;

        if (experienceSubscriptionId) {
          const subscriptionUpdateSuccess = await updateExperienceSubscription(
            gameDetails.id,
            data,
          );

          if (!subscriptionUpdateSuccess) {
            setIsConfigureDialogShown(false);
            return;
          }

          let imageUploadSuccess = true;
          let imageUploadError = '';
          if (data.file !== null && data.file !== undefined) {
            [imageUploadSuccess, imageUploadError] = await uploadImage(
              data.file,
              experienceSubscriptionId,
            );
          }

          if (imageUploadSuccess) {
            await queryClient.invalidateQueries({
              queryKey: ['universes', gameDetails.id, 'subscriptions'],
            });

            await router.push(
              `/dashboard/creations/experiences/${gameDetails.id}/associated-items?activeTab=Subscription`,
            );

            showSnackbar(translate('Message.UpdateSubscriptionSuccess'), true);
          } else {
            showSnackbar(imageUploadError, false);
          }

          setIsConfigureDialogShown(false);
        }
        return;
      }
      void router.push('/dashboard/creations');
    },
    [
      isLoadingGame,
      gameDetails,
      router,
      queryClient,
      experienceSubscriptionDetailsInfo.id,
      updateExperienceSubscription,
      uploadImage,
      showSnackbar,
      translate,
    ],
  );

  const copyToClipboard = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    void navigator.clipboard.writeText(`EXP-${experienceSubscriptionDetailsInfo.id}`);
    showSnackbar(translate('Message.CopiedSubscriptionID'), true);
  };

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
      subscriptionErrorArgs={subscriptionErrorArgs}
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
};

export default ConfigureExperienceSubscriptionFormV2;
