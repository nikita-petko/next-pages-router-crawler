import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { Button, Divider, FormHelperText, Grid, useSnackbar } from '@rbx/ui';
import { getErrorCode } from '@modules/clients';
import { useRouter } from 'next/router';
import { AssetError, FormMode, utils } from '@modules/miscellaneous/common';
import useThumbnailImage from '@modules/miscellaneous/common/components/ThumbnailImage/useThumbnailImage';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import useConfigureGenericFormStyles from './ConfigureGenericNoDistributionForm.styles';
import {
  BasicInfoDefaultFormType,
  BasicInfoForm,
  DefaultSettingsFormType,
  DeveloperItemDetails,
  getBackToCreationsPageLink,
  postDeveloperItemDetails,
} from '../../common';
import AssetAccessForm from '../../common/AssetAccessForm/AssetAccessForm';

export type ConfigureGenericFormType = BasicInfoDefaultFormType & DefaultSettingsFormType;

export type TConfigureGenericNoDistributionFormProps = {
  developerItemDetails: DeveloperItemDetails;
  enableAssetAccessForm: boolean;
  isCreatorEligibleForAssetAccessBeta: boolean;
  refreshData: () => Promise<void>;
};

const ConfigureGenericNoDistributionForm: FunctionComponent<
  React.PropsWithChildren<TConfigureGenericNoDistributionFormProps>
> = ({
  developerItemDetails,
  enableAssetAccessForm,
  isCreatorEligibleForAssetAccessBeta,
  refreshData,
}) => {
  const assetId = parseInt(developerItemDetails.id, 10);

  const {
    classes: {
      button,
      buttonContainer,
      divider,
      errorMessageContainer,
      formContainer,
      imageContainer,
      pageContainer,
    },
  } = useConfigureGenericFormStyles();
  const { translate } = useTranslation();
  const router = useRouter();
  const { enqueue } = useSnackbar();
  const { thumbnailImage } = useThumbnailImage({
    targetId: assetId,
    targetType: ThumbnailTypes.assetThumbnail,
    isStatusTextShown: true,
    returnPolicy: ReturnPolicy.PlaceHolder,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const methods = useForm<ConfigureGenericFormType>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    shouldUnregister: true,
    defaultValues: {
      description: developerItemDetails.description,
      name: developerItemDetails.name,
    },
  });

  const { isSubmitting, isValid, isValidating, isDirty } = methods.formState;

  const showSuccessToast = useCallback(() => {
    enqueue(
      {
        message: (
          <span data-testid='update-success-message'>
            {translate('Message.ChangesSavedSuccess')}
          </span>
        ),
        autoHide: true,
      },
      (reason) => reason === 'timeout',
    );
  }, [enqueue, translate]);

  const handleFormSubmit: SubmitHandler<ConfigureGenericFormType> = useCallback(
    async (data) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        await postDeveloperItemDetails(developerItemDetails.id, {
          description: data.description ?? '',
          isCopyingAllowed: false,
          name: data.name,
        });
        await refreshData();
        showSuccessToast();
      } catch (err) {
        const errorName = utils.getEnumKeyByValue(AssetError, getErrorCode(err));
        const errorReason = translate(`Error.${errorName}`) || translate('Error.UnknownError');
        setErrorMessage(`${errorReason} ${translate('Message.PleaseTryAgain')}`);
      } finally {
        setIsLoading(false);
      }
    },
    [refreshData, showSuccessToast, translate, developerItemDetails],
  );

  const handleFormCancel = useCallback(() => {
    router.push(getBackToCreationsPageLink(developerItemDetails));
  }, [developerItemDetails, router]);

  useEffect(() => {
    if (developerItemDetails) {
      methods.resetField('description', { defaultValue: developerItemDetails.description });
      methods.resetField('name', { defaultValue: developerItemDetails.name });
    }
  }, [developerItemDetails, methods]);

  return (
    <FormProvider {...methods}>
      <Grid container item classes={{ root: pageContainer }}>
        <Grid container item classes={{ root: formContainer }} alignItems='flex-start'>
          <Grid container item gap={2} XSmall={12} Medium={8} Large={6}>
            <Grid item XSmall={12}>
              <BasicInfoForm />
            </Grid>
            {enableAssetAccessForm && (
              <Grid item XSmall={12}>
                <Divider classes={{ root: divider }} />
                <AssetAccessForm
                  developerItemDetails={developerItemDetails}
                  isCreatorEligibleForAssetAccessBeta={isCreatorEligibleForAssetAccessBeta}
                />
              </Grid>
            )}
          </Grid>
          <Grid container item XSmall={12} Large={4} XLarge={2} classes={{ root: imageContainer }}>
            {thumbnailImage}
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

export default ConfigureGenericNoDistributionForm;
