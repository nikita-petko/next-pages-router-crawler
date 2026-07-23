import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { SubmitHandler } from 'react-hook-form';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { Restriction } from '@rbx/client-marketplace-publishing-requirements-api/v1';
import { useTranslation } from '@rbx/intl';
import {
  ReturnPolicy,
  ThumbnailClient,
  ThumbnailResponseState,
  ThumbnailTypes,
} from '@rbx/thumbnails';
import {
  Alert,
  Button,
  CloseIcon,
  Divider,
  Link,
  WarningIcon,
  FormHelperText,
  Grid,
  IconButton,
  InfoOutlinedIcon,
  Tooltip,
  Typography,
  useSnackbar,
  useTheme,
} from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import type { Money } from '@modules/clients/creatorStoreProduct/openCloudCreatorStoreProduct';
import {
  setAudioAttestation,
  setMusicArtists,
  setPublicSurfacing,
} from '@modules/clients/musicDiscovery';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import {
  assetToProduct,
  useMarketplaceFiatServiceProvider,
} from '@modules/marketplaceFiatService/MarketplaceFiatServiceProvider';
import type { CreatorStoreProductConfiguration } from '@modules/marketplaceFiatService/MarketplaceFiatServiceProvider';
import type { AssetConfigurationRestrictions } from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';
import {
  AllSettlePromiseSuccess,
  Asset,
  AssetError,
  CreatorType,
  FormMode,
} from '@modules/miscellaneous/common';
import legacyAssetConstants from '@modules/miscellaneous/components/EmptyState/legacyAssetConstants';
import useThumbnailImage from '@modules/miscellaneous/components/ThumbnailImage/useThumbnailImage';
import ThumbnailImageUploader from '@modules/miscellaneous/components/uploaders/components/ThumbnailImageUploader';
import { thumbnailImageTypes } from '@modules/miscellaneous/components/uploaders/constants/size';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { terms } from '@modules/miscellaneous/urls';
import { getEnumKeyByValue } from '@modules/miscellaneous/utils';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import DiscoverabilitySection from '../../../common/components/DiscoverabilitySection/DiscoverabilitySection';
import type { SongArtist } from '../../../common/components/SongArtistsSection/useGetFriendsAsSongArtists';
import AssetAccessForm from '../../common/AssetAccessForm/AssetAccessForm';
import BasicInfoForm from '../../common/BasicInfoForm/BasicInfoForm';
import {
  DistributionErrorState,
  getBackToCreationsPageLink,
  postDeveloperItemDetails,
} from '../../common/common';
import { useCurrentDeveloperItem } from '../../common/DeveloperItemProvider';
import SettingsForm from '../../common/SettingsForm/SettingsForm';
import type {
  BasicInfoDefaultFormType,
  DefaultSettingsFormType,
  DeveloperItemDetails,
} from '../../common/types';
import AudioPlayer from '../AudioPlayer/AudioPlayer';
import { uploadAudioThumbnail } from '../utils/audioThumbnailHelper';
import useConfigureMediaFiatFormStyles from './ConfigureMediaFiatForm.styles';

export const isModeratedPlaceholder = (value: string): boolean => /^#+$/.test(value.trim());

export enum ExperiencesAccessPrivacy {
  Private = 'Private',
  Public = 'Public',
}

const haveSameArtistIds = (artists: SongArtist[], savedArtists: SongArtist[]) =>
  artists.length === savedArtists.length &&
  artists.every((artist, index) => artist.userId === savedArtists[index]?.userId);

export type ConfigureMediaFiatFormType = BasicInfoDefaultFormType & DefaultSettingsFormType;

export type TConfigureMediaFiatFormProps = {
  assetConfigurationRestrictions: AssetConfigurationRestrictions;
  assetType: Asset;
  creatorName?: string;
  developerItemDetails: DeveloperItemDetails;
  enableAssetAccessForm: boolean;
  isAttested: boolean;
  isChartsEligible: boolean;
  isCreatorEligibleForAssetAccessBeta: boolean;
  initialSongArtists: SongArtist[];
  isOnMarketplace: boolean;
  refreshData: () => Promise<void>;
  isSfx: boolean;
  isPublicSurfacingEnabled: boolean;
  isDiscoverabilityAvailable: boolean;
};

const ConfigureMediaFiatForm: FunctionComponent<
  React.PropsWithChildren<TConfigureMediaFiatFormProps>
> = ({
  assetConfigurationRestrictions,
  assetType,
  creatorName,
  developerItemDetails,
  enableAssetAccessForm,
  isAttested,
  isChartsEligible,
  isCreatorEligibleForAssetAccessBeta,
  initialSongArtists,
  isOnMarketplace,
  refreshData,
  isSfx,
  isPublicSurfacingEnabled: initialIsPublicSurfacingEnabled,
  isDiscoverabilityAvailable,
}) => {
  const {
    classes: {
      button,
      buttonContainer,
      descriptionModerationAlert,
      discoverabilityContainer,
      errorMessageContainer,
      formAndPreviewContainer,
      imageUploaderContainer,
      moderationAlertContainer,
      moderationErrorIcon,
      pageContainer,
      previewColumn,
      previewHeader,
      subtitleContainer,
      divider,
    },
  } = useConfigureMediaFiatFormStyles();
  const theme = useTheme();
  const router = useRouter();
  const { enqueue } = useSnackbar();
  const { translate } = useTranslation();
  const { configureProduct } = useMarketplaceFiatServiceProvider();
  const { settings } = useSettings();
  const { user } = useAuthentication();
  const enableAudioUploadRevamp = settings.enableAudioUploadRevamp;
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { updateIconAssetId, iconAssetId } = useCurrentDeveloperItem();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isThumbnailDirty, setIsThumbnailDirty] = useState<boolean>(false);
  const [isAttestationComplete, setIsAttestationComplete] = useState<boolean>(isAttested);
  // Tracks the saved attestation state so dirty comparison and disabled prop
  // stay correct after a successful save without requiring a parent refresh.
  const [savedIsAttested, setSavedIsAttested] = useState<boolean>(isAttested);
  const isAttestationDirty = isAttestationComplete !== savedIsAttested;
  const [isPublicSurfacingEnabled, setIsPublicSurfacingEnabled] = useState<boolean>(
    initialIsPublicSurfacingEnabled,
  );
  const [savedIsPublicSurfacingEnabled, setSavedIsPublicSurfacingEnabled] = useState<boolean>(
    initialIsPublicSurfacingEnabled,
  );
  const isPublicSurfacingDirty = isPublicSurfacingEnabled !== savedIsPublicSurfacingEnabled;
  const [savedIsItemDistributed, setSavedIsItemDistributed] = useState<boolean>(isOnMarketplace);
  const [songArtists, setSongArtists] = useState<SongArtist[]>(initialSongArtists);
  const [savedSongArtists, setSavedSongArtists] = useState<SongArtist[]>(initialSongArtists);
  const isSongArtistsDirty = !haveSameArtistIds(songArtists, savedSongArtists);
  const assetId = parseInt(developerItemDetails.id, 10);

  const isAssetModerated = assetConfigurationRestrictions.publishingRestrictions.includes(
    Restriction.AssetModeration,
  );
  const { thumbnailData: audioFallbackThumbnailData } = useThumbnailImage({
    targetId: isSfx || iconAssetId || isAssetModerated ? 0 : assetId,
    targetType: ThumbnailTypes.assetThumbnail,
    returnPolicy: ReturnPolicy.PlaceHolder,
  });
  const blockedThumbnailPlaceholderUrl = isSfx
    ? legacyAssetConstants.small.audio
    : legacyAssetConstants.small.musicNote;
  const thumbnailPlaceholderUrl = isAssetModerated
    ? blockedThumbnailPlaceholderUrl
    : (audioFallbackThumbnailData?.imageUrl ??
      (isSfx ? legacyAssetConstants.small.audio : legacyAssetConstants.small.song));
  const [thumbnailState, setThumbnailState] = useState<ThumbnailResponseState | null>(null);

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

  const liveAssetName = useWatch({ control: methods.control, name: 'name' });

  const handleThumbnailChange = useCallback((file: File | null) => {
    setThumbnailFile(file);
    setIsThumbnailDirty(file !== null);
  }, []);

  const handleAttestationChange = useCallback((isComplete: boolean) => {
    setIsAttestationComplete(isComplete);
  }, []);

  const handlePublicSurfacingChange = useCallback((enabled: boolean) => {
    setIsPublicSurfacingEnabled(enabled);
  }, []);

  const { isSubmitting, isValid, isValidating, isDirty, dirtyFields } = methods.formState;
  const hasUnsavedChanges =
    isDirty ||
    isThumbnailDirty ||
    (isAttestationDirty && isAttestationComplete) ||
    isPublicSurfacingDirty ||
    isSongArtistsDirty;
  const isSaveDisabled = !hasUnsavedChanges || (!isValidating && !isValid);

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
        return;
      }

      try {
        const { name, description } = data;
        await postDeveloperItemDetails(developerItemDetails.id, {
          description: description ?? '',
          name,
        });
        methods.resetField('name', { defaultValue: name });
        methods.resetField('description', { defaultValue: description });
      } catch (errRes) {
        let errorMsgKey = 'Error.UnknownError';
        const err = await tryParseResponseError(errRes);
        if (err) {
          const nameOfError = getEnumKeyByValue(AssetError, err.code);
          if (nameOfError) {
            errorMsgKey = `Error.${nameOfError}`;
          }
        }
        const errorMsg = `${translate('Error.developerItemError')} ${translate(errorMsgKey)}`;
        setErrorMessage(errorMsg);
        throw new Error(errorMsg, { cause: errRes });
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
          published: data.isItemDistributed,
          productType: assetToProduct(assetType),
          basePrice,
        };
        await configureProduct(creatorStoreProductConfiguration);

        // In the future when we have price and/or distribution, use methods.resetField to reset the form field based on the response from configureProduct
      } catch (err) {
        console.error(err);
        const errorReason = translate(`Error.FiatConfigurationGenericError`);
        const errorMsg = `${errorReason} ${translate('Message.PleaseTryAgain')}`;
        setErrorMessage(errorMsg);
        throw new Error(errorMsg, { cause: err });
      }
    },
    [assetId, assetType, configureProduct, translate],
  );

  const pollIconUntilReady = useCallback(async (iconId: number): Promise<void> => {
    const maxAttempts = 24;
    const intervalMs = 5000;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await ThumbnailClient.reloadThumbnailImage(
        ThumbnailTypes.assetThumbnail,
        iconId,
      );
      if (
        result.state === ThumbnailResponseState.Completed ||
        result.state === ThumbnailResponseState.Blocked ||
        result.state === ThumbnailResponseState.Error
      ) {
        return;
      }
      await new Promise<void>((resolve) => {
        setTimeout(resolve, intervalMs);
      });
    }
  }, []);

  const userId = user?.id;

  const configureAudioThumbnail = useCallback(async (): Promise<boolean> => {
    if (!thumbnailFile) {
      return true;
    }
    try {
      const isGroupUpload = developerItemDetails.creator.type === CreatorType.Group;
      const newIconAssetId = await uploadAudioThumbnail(
        assetId,
        thumbnailFile,
        isGroupUpload,
        isGroupUpload ? undefined : userId,
        isGroupUpload ? developerItemDetails.creator.id : undefined,
      );
      await pollIconUntilReady(newIconAssetId);
      updateIconAssetId(newIconAssetId);
      setThumbnailFile(null);
      setIsThumbnailDirty(false);
      return true;
    } catch {
      enqueue(
        {
          message: translate('Message.AudioThumbnailConfigureFailed'),
          autoHide: true,
        },
        (reason) => reason === 'timeout',
      );
      return false;
    }
  }, [
    assetId,
    developerItemDetails.creator,
    enqueue,
    pollIconUntilReady,
    thumbnailFile,
    translate,
    updateIconAssetId,
    userId,
  ]);

  const isAudioRevampEnabled = enableAudioUploadRevamp && assetType === Asset.Audio;

  const handleFormSubmit: SubmitHandler<ConfigureMediaFiatFormType> = useCallback(
    async (data) => {
      setIsLoading(true);
      setErrorMessage(null);

      // isItemDistributed is unregistered when the Distribution section is hidden
      // (shouldUnregister: true). Fall back to the last saved value so we never
      // send published: undefined to the API and accidentally unpublish the asset.
      const resolvedData = {
        ...data,
        isItemDistributed: data.isItemDistributed ?? savedIsItemDistributed,
      };

      const responses = await Promise.allSettled([
        updateDeveloperItemDetails(resolvedData),
        configureFiatProduct(resolvedData),
      ]);

      if (responses.every((response) => response.status === AllSettlePromiseSuccess)) {
        setSavedIsItemDistributed(resolvedData.isItemDistributed);
        if (dirtyFields.name || dirtyFields.description || dirtyFields.isItemDistributed) {
          await refreshData();
        }
        let allDiscoverabilityWritesSucceeded = true;
        const thumbnailSuccess = enableAudioUploadRevamp ? await configureAudioThumbnail() : true;

        if (isAudioRevampEnabled && isAttestationDirty) {
          try {
            await setAudioAttestation(assetId, isAttestationComplete);
            setSavedIsAttested(isAttestationComplete);
          } catch {
            allDiscoverabilityWritesSucceeded = false;
            enqueue(
              {
                message: translate('Message.AttestationSaveFailed'),
                autoHide: true,
              },
              (reason) => reason === 'timeout',
            );
          }
        }

        if (isAudioRevampEnabled && !isSfx && isPublicSurfacingDirty) {
          try {
            await setPublicSurfacing(assetId, isPublicSurfacingEnabled);
            setSavedIsPublicSurfacingEnabled(isPublicSurfacingEnabled);
          } catch {
            allDiscoverabilityWritesSucceeded = false;
            enqueue(
              {
                message: translate('Message.DiscoverabilitySettingsSaveFailed'),
                autoHide: true,
              },
              (reason) => reason === 'timeout',
            );
          }
        }

        if (isAudioRevampEnabled && !isSfx && isSongArtistsDirty) {
          try {
            await setMusicArtists(
              assetId,
              songArtists.map((artist) => artist.userId),
            );
            setSavedSongArtists(songArtists);
          } catch {
            allDiscoverabilityWritesSucceeded = false;
            enqueue(
              {
                message: translate('Message.DiscoverabilitySettingsSaveFailed'),
                autoHide: true,
              },
              (reason) => reason === 'timeout',
            );
          }
        }

        if (thumbnailSuccess && allDiscoverabilityWritesSucceeded) {
          showSuccessToast();
        }
      } else {
        const errorMessages = responses
          .filter(
            (r): r is PromiseRejectedResult =>
              r.status !== AllSettlePromiseSuccess && r.reason instanceof Error,
          )
          .map((r) => (r.reason instanceof Error ? r.reason.message : ''))
          .join(', ');
        if (errorMessages) {
          setErrorMessage(`${errorMessages} ${translate('Message.PleaseTryAgain')}`);
        }
      }

      if (dirtyFields.isItemDistributed) {
        emitSaveDistributionStatus(resolvedData.isItemDistributed);
      }

      setIsLoading(false);
    },
    [
      assetId,
      configureAudioThumbnail,
      configureFiatProduct,
      dirtyFields.description,
      dirtyFields.isItemDistributed,
      dirtyFields.name,
      emitSaveDistributionStatus,
      enableAudioUploadRevamp,
      enqueue,
      isAttestationComplete,
      isAttestationDirty,
      isAudioRevampEnabled,
      isPublicSurfacingDirty,
      isPublicSurfacingEnabled,
      isSfx,
      isSongArtistsDirty,
      refreshData,
      savedIsItemDistributed,
      showSuccessToast,
      songArtists,
      translate,
      updateDeveloperItemDetails,
    ],
  );

  const handleFormCancel = useCallback(() => {
    void router.push(getBackToCreationsPageLink(developerItemDetails));
  }, [developerItemDetails, router]);

  useEffect(() => {
    if (developerItemDetails) {
      methods.reset(defaultValues);
    }
  }, [defaultValues, developerItemDetails, methods]);

  const isIdVerified = assetConfigurationRestrictions.isVerified;
  const isNameModerated = isAudioRevampEnabled && isModeratedPlaceholder(developerItemDetails.name);
  const isDescriptionModerated =
    isAudioRevampEnabled && isModeratedPlaceholder(developerItemDetails.description ?? '');
  const shouldDisableToggleForPublicSurfacing = isNameModerated || isDescriptionModerated;
  const isAudioModerated =
    isAudioRevampEnabled &&
    assetConfigurationRestrictions.publishingRestrictions.includes(Restriction.AssetModeration) &&
    !isNameModerated &&
    !isDescriptionModerated;
  const shouldDisableDistribution = isNameModerated || isDescriptionModerated;

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
      <Grid container item classes={{ root: `${pageContainer} ${formAndPreviewContainer}` }}>
        <Grid container item XSmall={12} XLarge={8}>
          {isAudioModerated && (
            <Grid item XSmall={12} classes={{ root: moderationAlertContainer }}>
              <Alert
                severity='error'
                icon={
                  <span className={moderationErrorIcon}>
                    <CloseIcon />
                  </span>
                }>
                <Typography style={{ color: 'white' }}>
                  {translate('Message.AudioContentModerated')}
                </Typography>
              </Alert>
            </Grid>
          )}
          {isNameModerated && (
            <Grid item XSmall={12} classes={{ root: moderationAlertContainer }}>
              <Alert
                severity='warning'
                icon={
                  <WarningIcon
                    fontSize='inherit'
                    style={{ color: theme.palette.actionV2.notice.fill }}
                  />
                }>
                <Typography style={{ color: 'white' }}>
                  {translate('Message.AudioNameModerated')}
                </Typography>
              </Alert>
            </Grid>
          )}
          <BasicInfoForm
            betweenNameAndDescriptionSlot={
              isDescriptionModerated ? (
                <Alert
                  className={descriptionModerationAlert}
                  severity='warning'
                  icon={
                    <WarningIcon
                      fontSize='inherit'
                      style={{ color: theme.palette.actionV2.notice.fill }}
                    />
                  }>
                  <Typography style={{ color: 'white' }}>
                    {translate('Message.AudioDescriptionModerated')}
                  </Typography>
                </Alert>
              ) : undefined
            }
          />
          {isAudioRevampEnabled && (
            <Grid item XSmall={12} classes={{ root: imageUploaderContainer }}>
              <Typography variant='subtitle2'>{translate('Label.ThumbnailOptional')}</Typography>
              {thumbnailState === ThumbnailResponseState.Blocked && (
                <Alert
                  severity='warning'
                  icon={
                    <WarningIcon
                      fontSize='inherit'
                      style={{ color: theme.palette.actionV2.notice.fill }}
                    />
                  }
                  action={
                    <Link href={terms.getAudioThumbnailModerationUrl()} target='_blank'>
                      {translate('Action.AudioThumbnailLearnMore')}
                    </Link>
                  }>
                  <Typography style={{ color: 'white' }}>
                    {translate('Message.AudioThumbnailModerated')}
                  </Typography>
                </Alert>
              )}
              <ThumbnailImageUploader
                targetId={iconAssetId ?? undefined}
                targetType={ThumbnailTypes.assetThumbnail}
                imageType={thumbnailImageTypes}
                imageAltText={translate('Label.AudioThumbnail')}
                onChange={handleThumbnailChange}
                uploadText={translate('Action.Change')}
                changeText={translate('Action.UploadSimple')}
                placeholderImageUrl={thumbnailPlaceholderUrl}
                blockedPlaceholderImageUrl={blockedThumbnailPlaceholderUrl}
                onThumbnailStateChange={setThumbnailState}
              />
            </Grid>
          )}
          {isAudioRevampEnabled && !isSfx && !isAudioModerated && isDiscoverabilityAvailable && (
            <Grid item XSmall={12} classes={{ root: discoverabilityContainer }}>
              <DiscoverabilitySection
                key={assetId}
                assetId={assetId}
                isChartsEligible={isChartsEligible}
                isIdVerified={isIdVerified}
                isAttested={savedIsAttested}
                isPublicSurfacingEnabled={isPublicSurfacingEnabled}
                isPublicSurfacingToggleDisabled={shouldDisableToggleForPublicSurfacing}
                songArtists={songArtists}
                onArtistsChange={setSongArtists}
                onAttestationChange={handleAttestationChange}
                onPublicSurfacingChange={handlePublicSurfacingChange}
              />
            </Grid>
          )}
          <Grid item XSmall={12}>
            <Divider classes={{ root: divider }} />
          </Grid>
          {/* In the audio revamp flow, regular Audio uses Discoverability instead of Distribution.
              SFX and legacy/non-revamp flows continue to show Distribution.
              Moderated audio hides the section entirely. */}
          {(!isAudioRevampEnabled || isSfx) && !isAudioModerated && (
            <>
              <Grid container item XSmall={12}>
                <Grid item XSmall={12} classes={{ root: subtitleContainer }}>
                  <Typography component='h3' variant='h3'>
                    {translate('Heading.Distribution')}
                  </Typography>
                </Grid>
                <SettingsForm
                  distributionErrorState={distributionErrorState}
                  isDistributed={savedIsItemDistributed}
                  assetId={assetId}
                  isSfx={isSfx}
                  shouldDisableDistribution={shouldDisableDistribution}
                />
              </Grid>
              <Grid item XSmall={12}>
                <Divider classes={{ root: divider }} />
              </Grid>
            </>
          )}
          {enableAssetAccessForm && !isAudioModerated && (
            <Grid item XSmall={12}>
              <AssetAccessForm
                developerItemDetails={developerItemDetails}
                isCreatorEligibleForAssetAccessBeta={isCreatorEligibleForAssetAccessBeta}
              />
              <Divider classes={{ root: divider }} />
            </Grid>
          )}
        </Grid>
        {/* Sibling order matters: small-screen stacking collapses to DOM order (form → preview → buttons). */}
        {isAudioRevampEnabled &&
          !isAudioModerated &&
          ((!isSfx && isChartsEligible && savedIsPublicSurfacingEnabled) ||
            (isSfx && savedIsItemDistributed)) && (
            <Grid item XSmall={12} XLarge={4} classes={{ root: previewColumn }}>
              <div className={previewHeader}>
                <Typography variant='subtitle2'>
                  {translate(isSfx ? 'Label.SoundEffectPreview' : 'Label.SongDetailsPreview')}
                </Typography>
                <Tooltip
                  placement='top'
                  title={
                    <Typography variant='body2'>
                      {translate(
                        isSfx
                          ? 'Message.SoundEffectPreviewTooltip'
                          : 'Message.SongDetailsPreviewTooltip',
                      )}
                    </Typography>
                  }>
                  <IconButton
                    size='small'
                    aria-label={translate(
                      isSfx ? 'Label.SoundEffectPreviewInfo' : 'Label.SongDetailsPreviewInfo',
                    )}>
                    <InfoOutlinedIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              </div>
              <AudioPlayer
                assetId={assetId}
                compact={isSfx}
                creatorName={creatorName}
                name={liveAssetName ?? developerItemDetails.name}
                thumbnailTargetId={iconAssetId}
              />
            </Grid>
          )}
        <Grid container item XSmall={12} XLarge={8} classes={{ root: buttonContainer }}>
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
            disabled={isSaveDisabled}
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
    </FormProvider>
  );
};

export default ConfigureMediaFiatForm;
