import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { captureException } from '@sentry/nextjs';
import {
  Avatar,
  Button,
  CheckCircleOutlineIcon,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Link,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@rbx/ui';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { ValidateAdRewardResponse } from '@rbx/clients/adsRewardService/v1';
import { DebouncedTextField } from '@modules/charts-generic';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import adsRewardServiceClient from '@modules/clients/adsRewardService';
import developerAdsStatsClient from '@modules/clients/developerAdsStats';
import { useSnackbarAlert } from '@modules/miscellaneous/hooks';
import usePlayWithRewardStyles from './PlayWithReward.styles';
import {
  PlayWithRewardCreationModalFormField,
  PlayWithRewardFormValues,
} from '../types/playWithRewardCreationModal';
import CreationModalProcessReceiptStep from './CreationModalProcessReceiptStep';

interface PlayWithRewardCreationModalProps {
  open: boolean;
  onClose: () => void;
  universeId: number;
  defaultFrequencyCap: number;
  onRefreshPlayWithRewardServingStatus: () => void;
}

interface FetchRewardInfoState {
  isLoading: boolean;
  isError: boolean;
  validateAdRewardResponse?: ValidateAdRewardResponse;
}

enum PlayWithRewardModalStep {
  SetupStep = 0,
  ProcessReceiptStep = 1,
}

const PlayWithRewardCreationModal = ({
  open,
  onClose,
  universeId,
  defaultFrequencyCap,
  onRefreshPlayWithRewardServingStatus,
}: PlayWithRewardCreationModalProps) => {
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const {
    classes: {
      dialogTitle,
      dialogStepper,
      dialogContentContainer,
      previewContainer,
      previewContainerCentered,
      dialogActionsContainer,
      inputLabel,
    },
    cx,
  } = usePlayWithRewardStyles();
  const [playWithRewardModalStep, setPlayWithRewardModalStep] = useState<PlayWithRewardModalStep>(
    PlayWithRewardModalStep.SetupStep,
  );
  const [rewardInfo, setRewardInfo] = useState<FetchRewardInfoState>();
  const showSnackbarMessage = useSnackbarAlert();
  const formMethods = useForm<PlayWithRewardFormValues>({
    defaultValues: {
      [PlayWithRewardCreationModalFormField.PRODUCT_ID]: 0,
      [PlayWithRewardCreationModalFormField.FREQUENCY_CAP]: defaultFrequencyCap,
      [PlayWithRewardCreationModalFormField.ACKNOWLEDGE_CHECKBOX]: false,
      [PlayWithRewardCreationModalFormField.MODERATOR_NOTE]: '',
    },
    mode: 'onChange',
  });
  const {
    control,
    formState: { errors, dirtyFields },
    handleSubmit,
    reset,
    getValues,
  } = formMethods;

  useEffect(() => {
    if (open) {
      // Clear states
      setPlayWithRewardModalStep(PlayWithRewardModalStep.SetupStep);
      setRewardInfo({ isLoading: false, isError: false });
      // Clear form
      reset();
    }
  }, [open, reset]);

  const fetchRewardInfo = useCallback(
    async (newProductId: number) => {
      setRewardInfo({ isLoading: true, isError: false });
      try {
        if (universeId <= 0 || newProductId === 0) {
          return;
        }
        const response = await adsRewardServiceClient.validateAdReward({
          validateAdRewardRequest: {
            universeId,
            productId: newProductId,
          },
        });

        setRewardInfo({ isLoading: false, isError: false, validateAdRewardResponse: response });
      } catch (error) {
        captureException(`Failed to fetch reward info: + ${error as Error}`);
        setRewardInfo({ isLoading: false, isError: true });
      }
    },
    [universeId],
  );

  const DeveloperProductsLink = useCallback(
    (chunks: React.ReactNode) => {
      return (
        <Link
          href={`/dashboard/creations/experiences/${universeId}/monetization/developer-products`}
          target='_blank'
          underline='always'>
          {chunks}
        </Link>
      );
    },
    [universeId],
  );

  const handlePlayWithRewardModalCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const handlePlayWithRewardModalContinue = useCallback(() => {
    setPlayWithRewardModalStep((currentStep) => {
      if (currentStep === PlayWithRewardModalStep.SetupStep) {
        return PlayWithRewardModalStep.ProcessReceiptStep;
      }
      return currentStep;
    });
  }, [setPlayWithRewardModalStep]);

  const handlePlayWithRewardModalBack = useCallback(() => {
    setPlayWithRewardModalStep((currentStep) => {
      if (currentStep === PlayWithRewardModalStep.ProcessReceiptStep) {
        return PlayWithRewardModalStep.SetupStep;
      }
      return currentStep;
    });
  }, [setPlayWithRewardModalStep]);

  const handlePlayWithRewardModalCreate = useCallback(async () => {
    handleSubmit(async () => {
      try {
        await developerAdsStatsClient.updateUniverseAdsSettings({
          universeId,
          updateUniverseAdsSettingsRequest: {
            isPlayWithRewardEnabled: true,
            rewardInfo: {
              productId: getValues(PlayWithRewardCreationModalFormField.PRODUCT_ID),
              rewardsFrequencyCapDaily: getValues(
                PlayWithRewardCreationModalFormField.FREQUENCY_CAP,
              ),
            },
          },
        });
        onRefreshPlayWithRewardServingStatus();
        onClose();
        showSnackbarMessage(
          'success',
          translate(
            translationKey(
              'Description.PlacementCreated',
              TranslationNamespace.ImmersiveAdsAnalytics,
            ),
          ),
        );
      } catch (error) {
        captureException(`Failed to update play with reward placement: + ${error as Error}`);
        showSnackbarMessage(
          'error',
          translate(
            translationKey(
              'Description.PlacementUpdateError',
              TranslationNamespace.ImmersiveAdsAnalytics,
            ),
          ),
        );
      }
    })();
  }, [
    handleSubmit,
    onClose,
    showSnackbarMessage,
    translate,
    universeId,
    getValues,
    onRefreshPlayWithRewardServingStatus,
  ]);

  const modalTitle = useMemo(() => {
    return (
      <DialogTitle className={dialogTitle}>
        {translate(
          translationKey(
            'Title.PlayWithRewardCreationModal',
            TranslationNamespace.ImmersiveAdsAnalytics,
          ),
        )}
      </DialogTitle>
    );
  }, [dialogTitle, translate]);

  const stepper = useMemo(() => {
    return (
      <Stepper
        activeStep={playWithRewardModalStep}
        orientation='horizontal'
        className={dialogStepper}>
        <Step>
          <StepLabel>
            {translate(
              translationKey('Step.PlacementSetup', TranslationNamespace.ImmersiveAdsAnalytics),
            )}
          </StepLabel>
        </Step>
        <Step>
          <StepLabel>
            {translate(
              translationKey('Step.ProcessReceipt', TranslationNamespace.ImmersiveAdsAnalytics),
            )}
          </StepLabel>
        </Step>
      </Stepper>
    );
  }, [playWithRewardModalStep, dialogStepper, translate]);

  const productPreviewLoadingIndicator = useMemo(() => {
    if (rewardInfo?.isLoading) {
      return <CircularProgress size={20} color='secondary' />;
    }
    if (rewardInfo?.validateAdRewardResponse?.isValidReward) {
      return <CheckCircleOutlineIcon color='success' fontSize='large' />;
    }
    return null;
  }, [rewardInfo]);

  return (
    <Dialog open={open} onClose={handlePlayWithRewardModalCancel}>
      {modalTitle}
      {stepper}
      {playWithRewardModalStep === PlayWithRewardModalStep.SetupStep && (
        <React.Fragment>
          <DialogContent>
            <div className={dialogContentContainer}>
              <Typography variant='body1' color='secondary'>
                {translateHTML(
                  translationKey(
                    'Description.FindDeveloperProduct',
                    TranslationNamespace.ImmersiveAdsAnalytics,
                  ),
                  [
                    {
                      opening: 'devProductLinkStart',
                      closing: 'devProductLinkEnd',
                      content: DeveloperProductsLink,
                    },
                  ],
                )}
              </Typography>
              <Controller
                control={control}
                name={PlayWithRewardCreationModalFormField.PRODUCT_ID}
                rules={{
                  validate: (value) => {
                    return value > 0 || 'Please enter a valid product ID';
                  },
                }}
                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                  <DebouncedTextField
                    {...field}
                    id='reward-item-input'
                    label={translate(
                      translationKey(
                        'Label.RewardItem',
                        TranslationNamespace.ImmersiveAdsAnalytics,
                      ),
                    )}
                    fullWidth
                    error={!!error}
                    placeholder={translate(
                      translationKey(
                        'Placeholder.DeveloperProductId',
                        TranslationNamespace.ImmersiveAdsAnalytics,
                      ),
                    )}
                    onDebouncedChange={(val: string) => {
                      const newProductId = Number(val);
                      if (!Number.isNaN(newProductId) && Number.isInteger(newProductId)) {
                        if (newProductId > 0) {
                          // Skip if already the same value
                          if (
                            getValues(PlayWithRewardCreationModalFormField.PRODUCT_ID) ===
                            newProductId
                          ) {
                            return;
                          }
                          onChange(newProductId);
                          fetchRewardInfo(newProductId);
                          return;
                        }
                      }
                      onChange(val);
                      setRewardInfo({ isLoading: false, isError: false });
                    }}
                    value={value || ''}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          {productPreviewLoadingIndicator}
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
              {rewardInfo?.validateAdRewardResponse?.isValidReward &&
              rewardInfo?.validateAdRewardResponse?.rewardDetails ? (
                <div className={previewContainer}>
                  <Avatar variant='circular' alt='Dev Product Icon'>
                    <Thumbnail2d
                      targetId={rewardInfo.validateAdRewardResponse.rewardDetails.imageAssetId || 0}
                      type={ThumbnailTypes.assetThumbnail}
                      returnPolicy={ReturnPolicy.PlaceHolder}
                      alt='Product Icon'
                    />
                  </Avatar>
                  <Typography variant='h6' color='primary'>
                    {rewardInfo.validateAdRewardResponse.rewardDetails.productName}
                  </Typography>
                </div>
              ) : (
                <div className={cx(previewContainer, previewContainerCentered)}>
                  <Typography color='disabled' className={inputLabel}>
                    {translate(
                      translationKey(
                        'Label.NoRewardItemFound',
                        TranslationNamespace.ImmersiveAdsAnalytics,
                      ),
                    )}
                  </Typography>
                </div>
              )}
              <Controller
                control={control}
                name={PlayWithRewardCreationModalFormField.FREQUENCY_CAP}
                rules={{
                  validate: (value) => {
                    return value > 0 || 'Max rewards should be a whole number greater than 0';
                  },
                }}
                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    id='frequency-cap-input'
                    label={translate(
                      translationKey(
                        'Label.MaxRewardsPerUser',
                        TranslationNamespace.ImmersiveAdsAnalytics,
                      ),
                    )}
                    fullWidth
                    helperText={translate(
                      translationKey(
                        'Label.RewardGrantDisclaimer',
                        TranslationNamespace.ImmersiveAdsAnalytics,
                      ),
                    )}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          {translate(
                            translationKey(
                              'Label.PerDay',
                              TranslationNamespace.ImmersiveAdsAnalytics,
                            ),
                          )}
                        </InputAdornment>
                      ),
                    }}
                    onChange={(e) => {
                      onChange(Number(e.target.value));
                    }}
                    value={value || ''}
                    error={!!error}
                  />
                )}
              />
              <Controller
                control={control}
                name={PlayWithRewardCreationModalFormField.MODERATOR_NOTE}
                rules={{
                  required: true,
                  maxLength: {
                    value: 250,
                    message: 'Reward description cannot exceed 250 characters',
                  },
                }}
                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                  <DebouncedTextField
                    {...field}
                    id='reward-description-input'
                    label={translate(
                      translationKey(
                        'Label.RewardDescription',
                        TranslationNamespace.ImmersiveAdsAnalytics,
                      ),
                    )}
                    fullWidth
                    error={!!error}
                    helperText={`${value?.length ?? 0}/250`}
                    inputProps={{ maxLength: 250 }}
                    placeholder={translate(
                      translationKey(
                        'Placeholder.RewardDescription',
                        TranslationNamespace.ImmersiveAdsAnalytics,
                      ),
                    )}
                    onDebouncedChange={(val: string) => {
                      onChange(val);
                    }}
                    value={value}
                    multiline
                    minRows={3}
                    maxRows={8}
                  />
                )}
              />
            </div>
          </DialogContent>
          <DialogActions className={dialogActionsContainer}>
            <Button
              onClick={handlePlayWithRewardModalContinue}
              variant='contained'
              color='primaryBrand'
              disabled={(() => {
                const { PRODUCT_ID, MODERATOR_NOTE, FREQUENCY_CAP } =
                  PlayWithRewardCreationModalFormField;

                const hasFieldsModified = dirtyFields[PRODUCT_ID] && dirtyFields[MODERATOR_NOTE];
                const hasNoErrors =
                  !errors[PRODUCT_ID] && !errors[MODERATOR_NOTE] && !errors[FREQUENCY_CAP];
                const hasValidReward = rewardInfo?.validateAdRewardResponse?.isValidReward;

                return !(hasFieldsModified && hasNoErrors && hasValidReward);
              })()}>
              {translate(
                translationKey('Label.Continue', TranslationNamespace.ImmersiveAdsAnalytics),
              )}
            </Button>
            <Button onClick={handlePlayWithRewardModalCancel} variant='contained' color='secondary'>
              {translate(
                translationKey('Label.Cancel', TranslationNamespace.ImmersiveAdsAnalytics),
              )}
            </Button>
          </DialogActions>
        </React.Fragment>
      )}
      {playWithRewardModalStep === PlayWithRewardModalStep.ProcessReceiptStep && (
        <FormProvider {...formMethods}>
          <CreationModalProcessReceiptStep
            handlePlayWithRewardModalCreate={handlePlayWithRewardModalCreate}
            handlePlayWithRewardModalBack={handlePlayWithRewardModalBack}
            handlePlayWithRewardModalCancel={handlePlayWithRewardModalCancel}
          />
        </FormProvider>
      )}
    </Dialog>
  );
};

export default PlayWithRewardCreationModal;
