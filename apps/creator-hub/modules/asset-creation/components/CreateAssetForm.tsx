import type { FunctionComponent, ChangeEvent } from 'react';
import React, { useCallback, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import type { SubmitHandler } from 'react-hook-form';
import { useForm, Controller } from 'react-hook-form';
import type { V1ItemsUploadFeeGetAssetTypeEnum } from '@rbx/client-itemconfiguration/v1';
import { HubMeta, buildBreadcrumb, buildTitle } from '@rbx/creator-hub-history';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import {
  Grid,
  Button,
  TextField,
  Typography,
  Link,
  Dialog,
  DialogTemplate,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  InfoOutlinedIcon,
  RobuxIcon,
  Tooltip,
  useSnackbar,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import type { Creator, CreationContext } from '@modules/clients/assetsupload';
import assetsUploadApiClient from '@modules/clients/assetsupload';
import itemConfigurationClient from '@modules/clients/itemconfiguration';
import { setAudioAttestation } from '@modules/clients/musicDiscovery';
import publishClient from '@modules/clients/publish';
import { getResponseFromError } from '@modules/clients/utils';
import AttestationSection from '@modules/creations/common/components/AttestationSection/AttestationSection';
import { uploadAudioThumbnail } from '@modules/creations/developerItem/media/utils/audioThumbnailHelper';
import { translateAssetType } from '@modules/creations/unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import GroupFeaturesStatus from '@modules/group/components/moderation/GroupFeaturesStatus';
import { Asset, HttpStatusCodes } from '@modules/miscellaneous/common';
import FormMode from '@modules/miscellaneous/common/enums/FormMode';
import ThumbnailImageUploader from '@modules/miscellaneous/components/uploaders/components/ThumbnailImageUploader';
import { thumbnailImageTypes } from '@modules/miscellaneous/components/uploaders/constants/size';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import type { CreateAssetFormProps } from '../constants/AssetTypeConstants';
import {
  isCreateAssetAvailable,
  dashboardAssetTypeToOpenCloudAssetType,
  maxFileSizeMB,
  allowedAssetTypeFormats,
  purchasableAssetTypes,
  quotaEnabledAssetTypes,
  getInfoUrl,
  maxDurationInSeconds,
  maxResolution,
} from '../constants/AssetTypeConstants';
import {
  assetUploadOperationStatusPollingIntervalSeconds,
  assetUploadOperationStatusPollingMaxRetries,
} from '../constants/commonConstants';
import {
  assetCreationAttemptEventModel,
  assetCreationFailureEventModel,
} from '../constants/eventConstants';
import useAvatarBackgroundAccess from '../hooks/useAvatarBackgroundAccess';
import AssetSelection from './AssetSelection';
import AssetUploader from './AssetUploader';
import useCreateAssetFormStyles from './CreateAssetForm.styles';
import createAssetFormContext from './providers/CreateAssetFormContext';
import type { AssetUploadFormType } from './type';
import { CreateAssetRegisterOptions } from './type';

export type configureAssetUpload = {
  targetType: string;
  file: File;
  name: string;
  description: string;
  creatorId: number;
  creatorType: string;
};

const forbiddenStatusCode: number = HttpStatusCodes.FORBIDDEN;

const pageHeadingByAsset: Partial<Record<Asset, string>> = {
  [Asset.AvatarBackground]: 'Heading.CreateBackgrounds',
};

// Asset types whose upload page is locked to a single type (no Asset Type picker shown).
const singleAssetTypeUploads: Asset[] = [Asset.AvatarBackground];

const isGroupAssetCreationAuthorizationError = (msg: string, errorCode: number | string) =>
  Number(errorCode) === forbiddenStatusCode &&
  /unauthorized to create an? .+ asset as Group/i.test(msg);

const CreateAssetForm: FunctionComponent<React.PropsWithChildren<CreateAssetFormProps>> = ({
  assetType,
}) => {
  const { trackerClient } = useEventTrackerProvider();
  const { user } = useAuthentication();
  const intl = useTranslation();
  const { translate, translateHTML } = intl;
  const { tPendingTranslation } = useTranslationWrapper(intl);
  const locale = useLocalization().locale ?? Locale.English;
  const { enqueue } = useSnackbar();

  const { droppedFile, updateDroppedFile } = useContext(createAssetFormContext);
  const [selectAssetType, setAssetType] = useState<Asset>(assetType);
  const [uploadFee, setUploadFee] = useState<number>(0);
  const [disableUpload, setDisableUpload] = useState<boolean>(false);
  const [isAssetUploading, setIsAssetUploading] = useState<boolean>(false);
  const [assetCreationErrorMsg, setAssetCreationErrorMsg] = useState<string>('');
  const [isConfirmDialogShown, setIsConfirmDialogShown] = useState<boolean>(false);
  const [quotaMessage, setQuotaMessage] = useState<string>(
    translate('Message.AssetLimitInfo', {
      assetType: selectAssetType,
    }),
  );
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isAttestationComplete, setIsAttestationComplete] = useState<boolean>(false);
  const { settings } = useSettings();
  const hasBackgroundAccess = useAvatarBackgroundAccess();

  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState,
    getFieldState,
    resetField,
  } = useForm<AssetUploadFormType>({
    mode: FormMode.OnTouched,
    reValidateMode: FormMode.OnChange,
    defaultValues: {
      name: '',
      description: translate(`Label.${assetType}`),
      file: null,
      assetType,
    },
    shouldUnregister: true,
  });
  const { errors, isValid, isValidating } = formState;
  const {
    classes: {
      SelectionArea,
      createButton,
      buttonContainer,
      formContainer,
      formHeading,
      assetUploaderContainer,
      imageUploaderContainer,
      inputFormPadding,
      inputFormElement,
      errorMessageStyles,
      formLinks,
    },
  } = useCreateAssetFormStyles();
  const currentGroup = useCurrentGroup();

  const getGroupId = useCallback(() => {
    return currentGroup?.id ?? null;
  }, [currentGroup?.id]);

  const handleAssetTypeChange = (event: ChangeEvent<{ value: unknown }>) => {
    setAssetCreationErrorMsg('');
    setDisableUpload(false);
    setIsAttestationComplete(false);
    const selected = Object.values(Asset).find((v) => v === event.target.value) ?? assetType;
    setAssetType(selected);
    if (!getFieldState('description').isDirty) {
      setValue('description', translate(`Label.${selected}`));
    }
    let queryParams = `assetType=${selected}`;
    const groupId = getGroupId();
    if (groupId) {
      queryParams += `&groupId=${groupId}`;
    }
    void router.push(`/dashboard/creations/upload?${queryParams}`, undefined, { shallow: true });
  };

  const assetTypeTranslateFunction = useCallback(
    (assetTypeToTranslate: string) => {
      return translate(`Label.${assetTypeToTranslate}`);
    },
    [translate],
  );

  const handleReset = useCallback(() => {
    resetField('file');
    resetField('name', { keepDirty: false });
    resetField('description', {
      keepDirty: false,
      defaultValue: assetTypeTranslateFunction(selectAssetType),
    });
    setThumbnailFile(null);
  }, [resetField, selectAssetType, assetTypeTranslateFunction]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await publishClient.getAssetQuotas('RateLimitUpload', selectAssetType);
        const quota = response.quotas?.[0];
        let quotaInfo = '';
        if (
          quota &&
          typeof quota.usage !== 'undefined' &&
          typeof quota.capacity !== 'undefined' &&
          typeof quota.duration !== 'undefined'
        ) {
          if (quota.capacity === 0) {
            quotaInfo = translate('Message.AssetUploadNoCapacity', {
              assetType: selectAssetType,
            });
            setDisableUpload(true);
          } else if (quota.usage === 0) {
            quotaInfo =
              quota.duration === 'Month'
                ? translate('Message.UploadQuotaCapacityMonth', {
                    assetType: selectAssetType,
                    capacity: String(quota.capacity),
                    duration: translate('Label.Month'),
                  })
                : translate('Message.AssetLimitInfo', {
                    assetType: selectAssetType,
                  });
          } else if (quota.expirationTime !== undefined) {
            const expiry = new Date(quota.expirationTime).toLocaleString();
            const remainingQuota = quota.capacity - quota.usage;
            quotaInfo =
              remainingQuota > 0
                ? translate('Message.UploadQuotaInfo', {
                    assetType: selectAssetType,
                    usage: String(remainingQuota),
                    capacity: String(quota.capacity),
                    expiry,
                  })
                : translate('Message.UploadQuotaReachedInfo', {
                    assetType: selectAssetType,
                    quota: String(remainingQuota),
                    capacity: String(quota.capacity),
                    expiry,
                  });
            if (remainingQuota <= 0) {
              setDisableUpload(true);
            }
          }
        } else {
          quotaInfo = translate('Message.AssetLimitInfo', {
            assetType: selectAssetType,
          });
        }
        setQuotaMessage(quotaInfo);
      } catch {
        setQuotaMessage(
          translate('Message.AssetLimitInfo', {
            assetType: selectAssetType,
          }),
        );
      }
    };
    if (quotaEnabledAssetTypes.includes(selectAssetType)) {
      void fetchData();
    }
    return () => {
      setQuotaMessage('');
    };
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
    // responsible for triaging issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- router should not be included in dependency array
  }, [selectAssetType]);

  useEffect(() => {
    setAssetCreationErrorMsg('');
    setDisableUpload(false);
    const fetchData = async (creatorId: number | undefined) => {
      try {
        // NOTE(nkachkovsky 07/25/2023): Manually set Video upload fee to 2000 robux until itemConfigurationClient updated to support video
        if (selectAssetType === Asset.Video) {
          setUploadFee(2000);
        } else {
          const translatedAssetType = translateAssetType(
            selectAssetType,
          ) as V1ItemsUploadFeeGetAssetTypeEnum;
          const response = await itemConfigurationClient.getItemUploadFee(
            translatedAssetType,
            undefined,
          );

          if (response.price !== undefined && response.price > 0) {
            setUploadFee(response.price);
          }
          if (response.canAfford === false) {
            trackerClient.sendEvent(
              assetCreationFailureEventModel(assetType, creatorId, 'InsufficientFunds'),
            );
            setIsConfirmDialogShown(false);
            setDisableUpload(true);
            setAssetCreationErrorMsg(translate('Message.InsufficientFunds'));
          }
        }
      } catch {
        setIsConfirmDialogShown(false);
        setDisableUpload(true);
        setAssetCreationErrorMsg(translate('Message.AssetCreationFailed'));
      }
    };

    if (purchasableAssetTypes.includes(selectAssetType)) {
      const groupId = getGroupId();
      const isGroup = groupId !== null;
      const creatorId = isGroup ? parseInt(groupId.toString(), 10) : user?.id;
      void fetchData(creatorId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @ts-ignore known issue with `react-hook-form`'s typing
  }, [selectAssetType, trackerClient]);

  const handleFileChange = useCallback(
    (file: File | null) => {
      setAssetCreationErrorMsg('');
      setValue('file', file, { shouldValidate: true });
      let fileName = '';
      if (!getFieldState('name').isDirty) {
        fileName = file ? file.name.slice(0, file.name.lastIndexOf('.')) : '';
        setValue('name', fileName, { shouldValidate: true });
      }
    },
    [setValue, getFieldState],
  );

  const redirectBack = useCallback(() => {
    let queryParams = `activeTab=${selectAssetType}`;
    const groupId = getGroupId();
    if (groupId) {
      queryParams += `&groupId=${groupId}`;
    }
    void router.push(`/dashboard/creations?${queryParams}`);
  }, [router, selectAssetType, getGroupId]);

  const getTranslatedVideoErrorMessages = (msg: string, defaultMessage: string) => {
    if (/No Video stream is found in the file/i.test(msg)) {
      return translate('Message.NoVideoStream');
    }
    if (/Too many video streams are found in the file/i.test(msg)) {
      return translate('Message.TooManyVideoStreams');
    }
    if (/Too many audio streams are found in the file/i.test(msg)) {
      return translate('Message.TooManyAudioStreams');
    }
    if (/The duration of the file is too long/i.test(msg)) {
      return translate('Message.DurationTooLong');
    }
    if (/The bitrate of the file is too high/i.test(msg)) {
      return translate('Message.BitrateTooHigh');
    }
    if (/Unsupported video codec/i.test(msg)) {
      return translate('Message.UnsupportedVideoCodec');
    }
    if (/Unsupported audio codec/i.test(msg)) {
      return translate('Message.UnsupportedAudioCodec');
    }
    if (/Unsupported video resolution/i.test(msg)) {
      return translate('Message.UnsupportedVideoResolution');
    }
    if (/Unsupported video frame rate/i.test(msg)) {
      return translate('Message.UnsupportedVideoFrameRate');
    }
    if (/Unsupported video pixel format/i.test(msg)) {
      return translate('Message.UnsupportedVideoPixelFormat');
    }
    if (/Unsupported video color space/i.test(msg)) {
      return translate('Message.UnsupportedVideoColorSpace');
    }
    if (/Unsupported audio sample rate/i.test(msg)) {
      return translate('Message.UnsupportedAudioSampleRate');
    }
    if (/Unsupported audio channel count/i.test(msg)) {
      return translate('Message.UnsupportedAudioChannelCount');
    }
    if (/Unsupported audio sample format/i.test(msg)) {
      return translate('Message.UnsupportedAudioSampleFormat');
    }
    if (/File corrupted/i.test(msg)) {
      return translate('Message.FileCorrupted');
    }
    return defaultMessage;
  };

  const getTranslatedImageErrorMessages = (msg: string, defaultMessage: string) => {
    if (/Invalid image dimensions/i.test(msg)) {
      return translate('Message.ItemConfigurationBadRequestError');
    }
    if (/Invalid image format/i.test(msg)) {
      return translate('Message.InvalidImageFormat');
    }
    if (/Image resolution/i.test(msg)) {
      return translate('Message.DecalResolutionLimits');
    }
    return defaultMessage;
  };

  const getTranslatedAvatarBackgroundErrorMessages = (msg: string, defaultMessage: string) => {
    if (/Invalid image format/i.test(msg)) {
      return translate('Message.InvalidImageFormat');
    }
    if (/Invalid image dimensions/i.test(msg)) {
      return translate('Message.AvatarBackgroundInvalidDimensions');
    }
    if (/alpha channel/i.test(msg)) {
      return translate('Message.AvatarBackgroundAlphaChannelNotAllowed');
    }
    return defaultMessage;
  };

  const getTranslatedGenericErrorMessages = (msg: string, errorCode: number | string) => {
    if (isGroupAssetCreationAuthorizationError(msg, errorCode)) {
      return translate('Error.ItemConfiguration.InvalidGroupPermission');
    }
    if (/moderated/i.test(msg)) {
      return translate('Message.NameOrDescriptionModeratedError');
    }
    if (/InsufficientFunds/i.test(msg)) {
      return translate('Message.InsufficientFunds');
    }
    if (/Id( )?Verification/i.test(msg)) {
      return translate('Message.IdVerification');
    }
    if (/Premium/i.test(msg)) {
      return translate('Message.Premium');
    }
    if (/rate limit/i.test(msg)) {
      return translate('Message.UploadRateLimited');
    }
    if (/upload attempt/i.test(msg)) {
      setDisableUpload(true);
      return translate('Message.UploadAttemptLimitReached');
    }
    if (/available quota/i.test(msg)) {
      setDisableUpload(true);
      return translate('Message.UploadQuotaExhausted');
    }
    return translate('Message.AssetCreationFailed');
  };

  const processErrorMessage = (
    msg: string,
    errorCode: number | string,
    creatorId: number | undefined,
  ) => {
    let message = getTranslatedGenericErrorMessages(msg, errorCode);
    // Get asset specific error messages
    if (
      assetType === Asset.Decal ||
      assetType === Asset.TShirt ||
      assetType === Asset.Shirt ||
      assetType === Asset.Pants
    ) {
      message = getTranslatedImageErrorMessages(msg, message);
    } else if (assetType === Asset.Video) {
      message = getTranslatedVideoErrorMessages(msg, message);
    } else if (assetType === Asset.AvatarBackground) {
      message = getTranslatedAvatarBackgroundErrorMessages(msg, message);
    }
    trackerClient.sendEvent(
      assetCreationFailureEventModel(
        selectAssetType,
        creatorId,
        `code:${errorCode},message:${msg}`,
      ),
    );
    setAssetCreationErrorMsg(message);
    setIsConfirmDialogShown(false);
  };

  const getErrorMessageFromAssetUploadAPI = async (e: unknown, creatorId: number | undefined) => {
    const r = getResponseFromError(e);
    const errorCode = r?.status ?? HttpStatusCodes.INTERNAL_SERVER_ERROR;
    try {
      const body: unknown = await r?.json();
      const messageValue =
        body !== null && typeof body === 'object' && 'message' in body
          ? (body as Record<string, unknown>).message
          : undefined;
      const message = typeof messageValue === 'string' ? messageValue : undefined;
      processErrorMessage(message ?? 'AssetCreationFailed', errorCode, creatorId);
    } catch {
      processErrorMessage('AssetCreationFailed', errorCode, creatorId);
    }
  };

  const pollForCompletedOperation = async (
    operationId: string,
    creatorId: number | undefined,
    currentAttempt: number,
  ): Promise<number | null> => {
    const operation = await assetsUploadApiClient.getOperationStatus(operationId);
    const isOperationDone = operation?.done ?? false;

    if (
      currentAttempt > assetUploadOperationStatusPollingMaxRetries ||
      (isOperationDone && operation?.error == null)
    ) {
      return operation?.response?.assetId ?? null;
    }
    if (isOperationDone && operation?.error != null) {
      const errorCode = operation?.error?.code ?? HttpStatusCodes.INTERNAL_SERVER_ERROR;
      const message = operation?.error?.message ?? 'AssetCreationFailed';
      processErrorMessage(message, errorCode, creatorId);
      return null;
    }
    await new Promise((r) => {
      setTimeout(r, 1000 * assetUploadOperationStatusPollingIntervalSeconds);
    });
    return pollForCompletedOperation(operationId, creatorId, currentAttempt + 1);
  };

  const uploadAsset = useCallback(
    async (file: File, name: string, description: string) => {
      setAssetCreationErrorMsg('');
      setDisableUpload(false);
      const uploadGroupId = getGroupId();
      const isGroupUpload = uploadGroupId !== null;
      const parsedGroupId = isGroupUpload ? parseInt(uploadGroupId.toString(), 10) : undefined;
      const creator: Creator = isGroupUpload ? { groupId: parsedGroupId } : { userId: user?.id };
      const creatorId = isGroupUpload ? parsedGroupId : creator.userId;
      trackerClient.sendEvent(
        assetCreationAttemptEventModel(selectAssetType, file.size, creatorId ?? undefined),
      );
      const creationContext: CreationContext = {
        creator,
        expectedPrice: purchasableAssetTypes.includes(selectAssetType) ? uploadFee : 0,
      };
      const req = {
        displayName: name,
        description,
        assetType: dashboardAssetTypeToOpenCloudAssetType[selectAssetType],
        creationContext,
      };
      try {
        const assetUploadOperationId = await assetsUploadApiClient.createAssetAndGetOperationId(
          req,
          file as Blob,
        );
        const createdAssetId = await pollForCompletedOperation(
          assetUploadOperationId,
          creatorId ?? undefined,
          0,
        );

        if (createdAssetId == null) {
          return;
        }

        if (settings.enableAudioUploadRevamp && thumbnailFile) {
          try {
            await uploadAudioThumbnail(
              createdAssetId,
              thumbnailFile,
              isGroupUpload,
              user?.id,
              parsedGroupId,
            );
          } catch {
            enqueue(
              {
                message: translate('Message.AudioThumbnailUploadFailed'),
                autoHide: true,
              },
              (reason) => reason === 'timeout',
            );
          }
        }

        if (settings.enableAudioUploadRevamp && selectAssetType === Asset.Audio) {
          try {
            await setAudioAttestation(createdAssetId, true);
          } catch {
            enqueue(
              {
                message: translate('Message.AttestationSaveFailed'),
                autoHide: true,
              },
              (reason) => reason === 'timeout',
            );
          }
        }

        redirectBack();
      } catch (e) {
        await getErrorMessageFromAssetUploadAPI(e, creatorId ?? undefined);
      }
    },
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
    // responsible for triaging issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: Codeowners should check this
    [selectAssetType, user, uploadFee, assetsUploadApiClient, trackerClient, thumbnailFile],
  );

  const onButtonSubmit: SubmitHandler<AssetUploadFormType> = useCallback(
    async (data) => {
      setIsAssetUploading(true);
      if (data.file) {
        await uploadAsset(data.file, data.name, data.description);
      }
      setIsAssetUploading(false);
    },
    [uploadAsset],
  );
  useEffect(() => {
    register('file', CreateAssetRegisterOptions.file);

    if (droppedFile != null) {
      handleFileChange(droppedFile);
      updateDroppedFile();
    }
  }, [register, selectAssetType, droppedFile, handleFileChange, updateDroppedFile]);

  const handlePrimaryClick = useCallback(() => {
    if (purchasableAssetTypes.includes(selectAssetType) && uploadFee > 0) {
      setIsConfirmDialogShown(true);
    } else {
      void handleSubmit(onButtonSubmit)();
    }
  }, [selectAssetType, onButtonSubmit, handleSubmit, uploadFee]);

  const getTextFieldMessage = (maxTextLength: number, currentTextLength: number) => {
    if (currentTextLength === 0) {
      return translate('Message.CharacterLimit', {
        limit: `${maxTextLength}`,
      });
    }
    return translate('Message.TextFieldCharacterCount', {
      currentTextLength: `${currentTextLength}`,
      maxTextLength: `${maxTextLength}`,
    });
  };

  // Avatar Background is created via its dedicated Create Backgrounds entry point, not the
  // generic Asset Type picker, so it is always excluded from the dropdown options.
  const creatableAssetTypes = Object.values(Asset).filter(
    (type) => isCreateAssetAvailable(type) && type !== Asset.AvatarBackground,
  );

  const showAssetTypePicker = !singleAssetTypeUploads.includes(assetType);

  const isAudioRevampEnabled = settings.enableAudioUploadRevamp && selectAssetType === Asset.Audio;

  const uploadButtonWithRobux = (fee: number) => {
    if (fee > 0) {
      return translate('UploadWithRobux', {
        price: `${fee}`,
      });
    }
    return translate('Action.UploadSimple');
  };

  const isAvatarBackground = selectAssetType === Asset.AvatarBackground;
  // Avatar background changes ship ungated; all other asset types are gated on Backgrounds access.
  const showCtaEnhancements =
    isAvatarBackground || (settings.enableAvatarBackgrounds && hasBackgroundAccess);
  const isPurchasable = purchasableAssetTypes.includes(selectAssetType);
  const showUploadFeeRow = showCtaEnhancements && isPurchasable && uploadFee > 0;
  // Lowercased asset type name (e.g. "shirt", "avatar background") interpolated into the dialog copy.
  const assetTypeName = translate(`Label.${selectAssetType}`).toLowerCase();

  const createAssetTitle = tPendingTranslation(
    'Create asset',
    'Asset upload page title and entry CTA shown to creators with Backgrounds access (replaces "Upload Asset").',
    translationKey('Label.CreateAssetSimple', TranslationNamespace.AssetUpload),
  );
  const uploadFeeLabel = tPendingTranslation(
    'Upload fee',
    'Label preceding the Robux upload fee amount shown above the upload/cancel buttons on the asset upload page.',
    translationKey('Label.UploadFee', TranslationNamespace.AssetUpload),
  );
  const uploadFeeTooltip = tPendingTranslation(
    'Fees are not refunded if an item is rejected through moderation.',
    'Tooltip explaining that the upload fee is non-refundable when an item is rejected through moderation.',
    translationKey('Message.UploadFeeNonRefundable', TranslationNamespace.AssetUpload),
  );
  const createConfirmTitle = tPendingTranslation(
    'Create {assetType}',
    'Title of the upload confirmation dialog; {assetType} is the lowercased asset type name, e.g. "shirt".',
    translationKey('Heading.CreateAssetConfirm', TranslationNamespace.AssetUpload),
    { assetType: assetTypeName },
  );
  const createConfirmContent = tPendingTranslation(
    "You'll be charged a {price} Robux upload fee to create this {assetType}. Do you want to continue?",
    'Body of the upload confirmation dialog; {price} is the Robux upload fee, {assetType} is the lowercased asset type name.',
    translationKey('Message.CreateAssetConfirmation', TranslationNamespace.AssetUpload),
    { price: `${uploadFee}`, assetType: assetTypeName },
  );

  // Page title: gated non-avatar-background uploads show "Create asset"; avatar background keeps its
  // dedicated "Create background" heading; everyone else sees the legacy "Upload Asset".
  const pageHeading =
    showCtaEnhancements && assetType !== Asset.AvatarBackground
      ? createAssetTitle
      : translate(pageHeadingByAsset[assetType] ?? 'Heading.CreateAsset');

  const getPrimaryButtonLabel = () => {
    if (showCtaEnhancements) {
      return translate('Action.Create');
    }
    return isPurchasable ? uploadButtonWithRobux(uploadFee) : translate('Action.UploadSimple');
  };

  const cancelButton = (
    <Button
      variant='outlined'
      size='large'
      color='primary'
      onClick={redirectBack}
      disabled={isAssetUploading}>
      {translate('Action.Cancel')}
    </Button>
  );

  const primaryButton = (
    <Button
      classes={{ root: createButton }}
      data-testid='upload-asset-button'
      variant='contained'
      size='large'
      onClick={handlePrimaryClick}
      disabled={
        (!isValidating && !isValid) ||
        disableUpload ||
        (isAudioRevampEnabled && !isAttestationComplete)
      }
      loading={isAssetUploading}>
      {getPrimaryButtonLabel()}
    </Button>
  );

  return (
    <Grid container item classes={{ root: formContainer }}>
      {getGroupId() !== null && <GroupFeaturesStatus />}
      <Grid item XSmall={12} className={formHeading}>
        <Typography variant='h1'>{pageHeading}</Typography>
        <HubMeta
          title={buildTitle(pageHeading)}
          breadcrumb={buildBreadcrumb(translate('Heading.Creations'), pageHeading)}
        />
      </Grid>
      <Grid item XSmall={12} classes={{ root: SelectionArea }}>
        {showAssetTypePicker && (
          <AssetSelection
            selectionValue={selectAssetType}
            label={translate('Label.AssetType')}
            translateFunction={assetTypeTranslateFunction}
            listOfInputs={creatableAssetTypes}
            handleChange={handleAssetTypeChange}
          />
        )}
        <Grid item XSmall={12} className={formLinks}>
          <Typography variant='body1'>
            {selectAssetType === Asset.AvatarBackground ? (
              translateHTML('Message.UploadAvatarBackgroundHint', [
                {
                  opening: 'linkStart',
                  closing: 'linkEnd',
                  content(chunks) {
                    return (
                      <Link href={getInfoUrl(selectAssetType)} target='_blank'>
                        {chunks}
                      </Link>
                    );
                  },
                },
              ])
            ) : (
              <>
                <span>
                  {selectAssetType === Asset.Audio || selectAssetType === Asset.Video
                    ? quotaMessage
                    : ''}
                </span>
                <Link
                  href={getInfoUrl(selectAssetType)}
                  aria-label={translate('Message.LearnMore')}
                  target='_blank'>
                  {translate('Message.LearnMore')}
                </Link>
              </>
            )}
          </Typography>
        </Grid>
      </Grid>
      <Grid container item direction='row' XLarge={12} className={assetUploaderContainer}>
        <AssetUploader
          data-testid='assetuploader'
          acceptedFileTypes={allowedAssetTypeFormats(selectAssetType)}
          onChange={handleFileChange}
          onRemove={handleReset}
          onReset={handleReset}
          maxFileSizeMB={maxFileSizeMB(selectAssetType)}
          durationLimit={maxDurationInSeconds(assetType)}
          maxResolutionLimit={maxResolution(assetType)}
          assetType={selectAssetType}
          droppedFile={droppedFile}
        />
      </Grid>
      <Grid container item XSmall={12} XLarge={9} className={inputFormPadding}>
        <Grid item XSmall={8} className={inputFormElement}>
          <Controller
            name='name'
            control={control}
            rules={CreateAssetRegisterOptions.name}
            render={({ field }) => (
              <TextField
                {...field}
                error={!!errors.name}
                fullWidth
                multiline
                required
                id='name'
                label={translate('Label.Name')}
                helperText={
                  errors.name && errors.name.message
                    ? translate(errors.name.message)
                    : getTextFieldMessage(50, getValues('name').length)
                }
              />
            )}
          />
        </Grid>
        <Grid item XSmall={8} className={inputFormElement}>
          <Controller
            name='description'
            control={control}
            rules={CreateAssetRegisterOptions.description}
            render={({ field }) => (
              <TextField
                {...field}
                error={!!errors.description}
                fullWidth
                multiline
                minRows={6}
                required
                id='description'
                label={translate('Label.Description')}
                helperText={
                  errors.description && errors.description.message
                    ? translate(errors.description.message)
                    : getTextFieldMessage(1000, getValues('description').length)
                }
              />
            )}
          />
        </Grid>
      </Grid>
      <Grid container item XSmall={12} XLarge={9}>
        {isAudioRevampEnabled && (
          <Grid item XSmall={12} classes={{ root: imageUploaderContainer }}>
            <Typography variant='subtitle2'>{translate('Label.ThumbnailOptional')}</Typography>
            <ThumbnailImageUploader
              ariaDescribedBy='audio-thumbnail-create-aria-description'
              imageType={thumbnailImageTypes}
              imageAltText={translate('Label.AudioThumbnail')}
              infoSection2={translate('Message.Moderation')}
              changeText={translate('Action.UploadSimple')}
              onChange={setThumbnailFile}
            />
          </Grid>
        )}
        {isAudioRevampEnabled && (
          <Grid item XSmall={12}>
            <AttestationSection
              descriptionKey='Description.AttestToOwnershipSubtitle'
              isEditMode={false}
              tosKey='Message.AttestationTOSAgreement'
              onAttestationChange={setIsAttestationComplete}
            />
          </Grid>
        )}
        {showUploadFeeRow && (
          <Grid item XSmall={12} className='flex flex-row items-center gap-small'>
            <Typography variant='body1'>{uploadFeeLabel}</Typography>
            <RobuxIcon />
            <Typography variant='body1'>
              {new Intl.NumberFormat(locale).format(uploadFee)}
            </Typography>
            <Tooltip title={uploadFeeTooltip} placement='top' arrow>
              <IconButton aria-label={uploadFeeTooltip} color='secondary' size='small'>
                <InfoOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        )}
        <Grid item XSmall={12} classes={{ root: buttonContainer }}>
          {showCtaEnhancements ? (
            <>
              {primaryButton}
              {cancelButton}
            </>
          ) : (
            <>
              {cancelButton}
              {primaryButton}
            </>
          )}
          {assetCreationErrorMsg && (
            <>
              <br />
              <Typography classes={{ root: errorMessageStyles }}>
                {assetCreationErrorMsg}
              </Typography>
            </>
          )}
        </Grid>
      </Grid>
      {showCtaEnhancements ? (
        <Dialog open={isConfirmDialogShown}>
          <DialogTitle>{createConfirmTitle}</DialogTitle>
          <DialogContent>
            <DialogContentText>{createConfirmContent}</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              variant='contained'
              size='large'
              onClick={handleSubmit(onButtonSubmit)}
              loading={isAssetUploading}>
              {translate('Action.Create')}
            </Button>
            <Button
              variant='outlined'
              size='large'
              color='primary'
              onClick={() => setIsConfirmDialogShown(false)}
              disabled={isAssetUploading}>
              {translate('Action.Cancel')}
            </Button>
          </DialogActions>
        </Dialog>
      ) : (
        <Dialog open={isConfirmDialogShown}>
          <DialogTemplate
            onConfirm={handleSubmit(onButtonSubmit)}
            onCancel={() => setIsConfirmDialogShown(false)}
            title={translate('Heading.UploadForRobux', { price: `${uploadFee}` })}
            content={translate('Message.AssetUploadWithRobuxConfirmation', {
              price: `${uploadFee}`,
            })}
            confirmText={translate('UploadWithRobux', {
              price: `${uploadFee}`,
            })}
            cancelText={translate('Action.Cancel')}
            loading={isAssetUploading}
          />
        </Dialog>
      )}
    </Grid>
  );
};

export default CreateAssetForm;
