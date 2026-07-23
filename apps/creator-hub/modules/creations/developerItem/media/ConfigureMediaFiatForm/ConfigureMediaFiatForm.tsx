import { tryParseResponseError } from '@modules/clients';
import {
  AllSettlePromiseSuccess,
  Asset,
  AssetError,
  FormMode,
  utils,
} from '@modules/miscellaneous/common';
import { useTranslation } from '@rbx/intl';
import { Button, Divider, FormHelperText, Grid, Typography, useSnackbar } from '@rbx/ui';
import { useRouter } from 'next/router';
import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { Money } from '@modules/clients/creatorStoreProduct/openCloudCreatorStoreProduct';
import type { AssetConfigurationRestrictions } from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';
import {
  assetToProduct,
  useMarketplaceFiatServiceProvider,
} from '@modules/marketplaceFiatService/MarketplaceFiatServiceProvider';
import type { CreatorStoreProductConfiguration } from '@modules/marketplaceFiatService/MarketplaceFiatServiceProvider';
import { Restriction } from '@rbx/clients/marketplacePublishingRequirementsApi';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import type { FrontendFlags } from '@modules/toolboxService/toolboxFeatureManagement';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import {
  BasicInfoDefaultFormType,
  BasicInfoForm,
  DefaultSettingsFormType,
  DeveloperItemDetails,
  DistributionErrorState,
  SettingsForm,
  getBackToCreationsPageLink,
  postDeveloperItemDetails,
} from '../../common';
import useConfigureMediaFiatFormStyles from './ConfigureMediaFiatForm.styles';
import AssetAccessForm from '../../common/AssetAccessForm/AssetAccessForm';

export enum ExperiencesAccessPrivacy {
  Private = 'Private',
  Public = 'Public',
}

export type ConfigureMediaFiatFormType = BasicInfoDefaultFormType & DefaultSettingsFormType;

export type TConfigureMediaFiatFormProps = {
  assetConfigurationRestrictions: AssetConfigurationRestrictions;
  assetType: Asset;
  developerItemDetails: DeveloperItemDetails;
  enableAssetAccessForm: boolean;
  frontendFlags: FrontendFlags;
  isCreatorEligibleForAssetAccessBeta: boolean;
  isOnMarketplace: boolean;
  refreshData: () => Promise<void>;
};

const ConfigureMediaFiatForm: FunctionComponent<
  React.PropsWithChildren<TConfigureMediaFiatFormProps>
> = ({
  assetConfigurationRestrictions,
  assetType,
  developerItemDetails,
  enableAssetAccessForm,
  frontendFlags,
  isCreatorEligibleForAssetAccessBeta,
  isOnMarketplace,
  refreshData,
}) => {
  const {
    classes: {
      button,
      buttonContainer,
      errorMessageContainer,
      pageContainer,
      subtitleContainer,
      divider,
    },
  } = useConfigureMediaFiatFormStyles();
  const router = useRouter();
  const { enqueue } = useSnackbar();
  const { translate } = useTranslation();
  const { configureProduct } = useMarketplaceFiatServiceProvider();
  const enableAudioDistributionOnboarding =
    frontendFlags[FrontendFlagName.FrontendFlagEnableAudioDistributionOnboarding];
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const assetId = parseInt(developerItemDetails.id, 10);

  const defaultValues = useMemo(
    () => ({
      description: developerItemDetails.description,
      isItemDistributed: isOnMarketplace,
      name: developerItemDetails.name,
    }),
    [developerItemDetails.description, developerItemDetails.name, isOnMarketplace],
  );

  const methods = useForm<ConfigureMediaFiatFormType>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    shouldUnregister: true,
    defaultValues,
  });

  const { isSubmitting, isValid, isValidating, isDirty, dirtyFields } = methods.formState;

  const showSuccessToast = useCallback(() => {
    enqueue(
      {
        autoHide: true,
        message: (
          <span data-testid='update-success-message'>
            {translate('Message.ChangesSavedSuccess')}
          </span>
        ),
      },
      (reason) => reason === 'timeout',
    );
  }, [enqueue, translate]);

  const emitSaveDistributionStatus = useCallback(
    (isDistributed: boolean) => {
      unifiedLogger.logClickEvent({
        eventName: 'clickSaveDistributionStatus.distribution',
        parameters: {
          distributed: isDistributed.toString(),
        },
      });
    },
    [unifiedLogger],
  );

  const updateDeveloperItemDetails = useCallback(
    async (data: ConfigureMediaFiatFormType) => {
      if (!dirtyFields.name && !dirtyFields.description) {
        return Promise.resolve();
      }

      try {
        const { name, description } = data;
        await postDeveloperItemDetails(developerItemDetails.id, {
          description: description ?? '',
          name,
        });
        methods.resetField('name', { defaultValue: name });
        methods.resetField('description', { defaultValue: description });
        return Promise.resolve();
      } catch (errRes) {
        let errorMsgKey = 'Error.UnknownError';
        const err = await tryParseResponseError(errRes);
        if (err) {
          const nameOfError = utils.getEnumKeyByValue(AssetError, err.code);
          if (nameOfError) {
            errorMsgKey = `Error.${nameOfError}`;
          }
        }
        const errorMsg = `${translate('Error.developerItemError')} ${translate(errorMsgKey)}`;
        setErrorMessage(errorMsg);
        return Promise.reject(errorMsg);
      }
    },
    [developerItemDetails.id, dirtyFields.description, dirtyFields.name, methods, translate],
  );

  const configureFiatProduct = useCallback(
    async (data: ConfigureMediaFiatFormType) => {
      try {
        const basePrice: Money = { currencyCode: 'USD', quantity: { exponent: 0, significand: 0 } };
        const creatorStoreProductConfiguration: CreatorStoreProductConfiguration = {
          assetId: assetId.toString(),
          published: enableAudioDistributionOnboarding ? data.isItemDistributed : false,
          productType: assetToProduct(assetType),
          basePrice,
        };
        await configureProduct(creatorStoreProductConfiguration);

        // In the future when we have price and/or distribution, use methods.resetField to reset the form field based on the response from configureProduct
        return Promise.resolve();
      } catch (err) {
        // eslint-disable-next-line no-console -- I believe we added this so that Sentry can catch the error
        console.error(err);
        const errorReason = translate(`Error.FiatConfigurationGenericError`);
        const errorMsg = `${errorReason} ${translate('Message.PleaseTryAgain')}`;
        setErrorMessage(errorMsg);
        return Promise.reject(errorMsg);
      }
    },
    [assetId, assetType, configureProduct, enableAudioDistributionOnboarding, translate],
  );

  const handleFormSubmit: SubmitHandler<ConfigureMediaFiatFormType> = useCallback(
    async (data) => {
      setIsLoading(true);
      setErrorMessage(null);

      const responses = await Promise.allSettled([
        updateDeveloperItemDetails(data),
        configureFiatProduct(data),
      ]);

      if (responses.every((response) => response.status === AllSettlePromiseSuccess)) {
        showSuccessToast();
        await refreshData();
      }

      if (dirtyFields.isItemDistributed) {
        emitSaveDistributionStatus(data.isItemDistributed);
      }

      setIsLoading(false);
      return null;
    },
    [
      configureFiatProduct,
      dirtyFields.isItemDistributed,
      emitSaveDistributionStatus,
      refreshData,
      showSuccessToast,
      updateDeveloperItemDetails,
    ],
  );

  const handleFormCancel = useCallback(() => {
    router.push(getBackToCreationsPageLink(developerItemDetails));
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Codeowners is responsible for triaging issue.
  }, [developerItemDetails]);

  useEffect(() => {
    if (developerItemDetails) {
      methods.reset(defaultValues);
    }
  }, [defaultValues, developerItemDetails, methods]);

  // First encountered pulishing restriction will override the error state
  let distributionErrorState = DistributionErrorState.AssetNotPublic;
  if (assetConfigurationRestrictions.publishingRestrictions.includes(Restriction.Verification)) {
    distributionErrorState = DistributionErrorState.NotStartedAudioDistribution;
  } else if (
    assetConfigurationRestrictions.publishingRestrictions.includes(Restriction.RightsClaim)
  ) {
    distributionErrorState = DistributionErrorState.RightsClaim;
  } else if (assetConfigurationRestrictions.canPublish) {
    distributionErrorState = DistributionErrorState.Approved;
  }

  return (
    <FormProvider {...methods}>
      <Grid container item classes={{ root: pageContainer }}>
        <Grid container item XSmall={12} XLarge={8}>
          <BasicInfoForm />
          <Grid item XSmall={12}>
            <Divider classes={{ root: divider }} />
          </Grid>
          {enableAssetAccessForm && (
            <Grid item XSmall={12}>
              <AssetAccessForm
                developerItemDetails={developerItemDetails}
                isCreatorEligibleForAssetAccessBeta={isCreatorEligibleForAssetAccessBeta}
              />
              <Divider classes={{ root: divider }} />
            </Grid>
          )}
          <Grid container item XSmall={12}>
            <Grid item XSmall={12} classes={{ root: subtitleContainer }}>
              <Typography component='h3' variant='h3'>
                {translate('Heading.Distribution')}
              </Typography>
            </Grid>
            <SettingsForm
              distributionErrorState={
                enableAudioDistributionOnboarding
                  ? distributionErrorState
                  : DistributionErrorState.AssetNotPublic
              }
              isDistributed={isOnMarketplace}
              assetId={assetId}
            />
          </Grid>
        </Grid>
        <Grid container item XSmall={12} XLarge={8}>
          <Grid item XSmall={12}>
            <Divider />
          </Grid>
          <Grid container item XSmall={12} classes={{ root: buttonContainer }}>
            <Button
              classes={{ root: button }}
              color='primary'
              disabled={isSubmitting}
              onClick={handleFormCancel}
              size='large'
              variant='outlined'>
              {translate('Action.Cancel')}
            </Button>
            <Button
              classes={{ root: button }}
              data-testid='save-button'
              disabled={!isDirty || (!isValidating && !isValid)}
              loading={isSubmitting || isLoading}
              onClick={methods.handleSubmit(handleFormSubmit)}
              size='large'
              variant='contained'>
              {translate('Action.SaveChanges')}
            </Button>
            {errorMessage && (
              <FormHelperText classes={{ root: errorMessageContainer }}>
                {errorMessage}
              </FormHelperText>
            )}
          </Grid>
        </Grid>
      </Grid>
    </FormProvider>
  );
};

export default ConfigureMediaFiatForm;
