import React, {
  FunctionComponent,
  Fragment,
  useCallback,
  useState,
  ChangeEvent,
  useEffect,
  useContext,
} from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { publishClient } from '@modules/clients';
import FormMode from '@modules/miscellaneous/common/enums/FormMode';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  Divider,
  Button,
  TextField,
  Typography,
  Link,
  Dialog,
  DialogTemplate,
} from '@rbx/ui';
import { useRouter } from 'next/router';
import assetsUploadApiClient, { Creator, CreationContext } from '@modules/clients/assetsupload';
import { useAuthentication } from '@modules/authentication/providers';
import { Asset, HttpStatusCodes } from '@modules/miscellaneous/common';
import itemConfigurationClient from '@modules/clients/itemconfiguration';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { getResponseFromError } from '@modules/clients/utils';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { HubMeta, buildBreadcrumb, buildTitle } from '@rbx/creator-hub-history';
import { translateAssetType } from '@modules/creations';
import { V1ItemsUploadFeeGetAssetTypeEnum } from '@rbx/client-itemconfiguration/v1';
import { useSettings } from '@modules/settings';
import GroupFeaturesStatus from '@modules/group/components/moderation/GroupFeaturesStatus';
import {
  assetCreationAttemptEventModel,
  assetCreationFailureEventModel,
} from '../constants/eventConstants';
import {
  CreateAssetFormProps,
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
import AssetSelection from './AssetSelection';
import AssetUploader from './AssetUploader';
import useCreateAssetFormStyles from './CreateAssetForm.styles';

import { CreateAssetRegisterOptions, AssetUploadFormType } from './type';
import createAssetFormContext from './providers/CreateAssetFormContext';
import {
  assetUploadOperationStatusPollingIntervalSeconds,
  assetUploadOperationStatusPollingMaxRetries,
} from '../constants/commonConstants';

export type configureAssetUpload = {
  targetType: string;
  file: File;
  name: string;
  description: string;
  creatorId: number;
  creatorType: string;
};

const CreateAssetForm: FunctionComponent<React.PropsWithChildren<CreateAssetFormProps>> = ({
  assetType,
}) => {
  const { trackerClient } = useEventTrackerProvider();
  const { user } = useAuthentication();
  const { translate } = useTranslation();

  const { droppedFile, updateDroppedFile } = useContext(createAssetFormContext);
  const [selectAssetType, setAssetType] = useState<Asset>(assetType);
  const [uploadFee, setUploadFee] = useState<number>(0);
  const [disableUpload, setDisableUpload] = useState<boolean>(false);
  const [isAssetUploading, setIsAssetUploading] = useState<boolean>(false);
  const [assetCreationErrorMsg, setAssetCreationErrorMsg] = useState<string>('');
  const [isConfirmDialogShown, setIsConfirmDialogShown] = useState<boolean>(false);
  const [quotaMessage, setQuotaMessage] = useState<string>(
    translate('Message.AssetLimitInfo', {
      assetType: `${selectAssetType}`,
    }),
  );

  const { settings } = useSettings();

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
    const selected = Asset[event.target.value as keyof typeof Asset];
    setAssetType(selected);
    if (!getFieldState('description').isDirty) {
      setValue('description', translate(`Label.${selected}`));
    }
    let queryParams = `assetType=${selected}`;
    const groupId = getGroupId();
    if (groupId) {
      queryParams += `&groupId=${groupId}`;
    }
    router.push(`/dashboard/creations/upload?${queryParams}`, undefined, { shallow: true });
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
              assetType: `${selectAssetType}`,
            });
            setDisableUpload(true);
          } else if (quota.usage === 0) {
            quotaInfo =
              quota.duration === 'Month'
                ? translate('Message.UploadQuotaCapacityMonth', {
                    assetType: `${selectAssetType}`,
                    capacity: `${quota.capacity}`,
                    duration: translate('Label.Month'),
                  })
                : translate('Message.AssetLimitInfo', {
                    assetType: `${selectAssetType}`,
                  });
          } else if (quota.expirationTime !== undefined) {
            const expiry = new Date(quota.expirationTime).toLocaleString();
            const remainingQuota = quota.capacity - quota.usage;
            quotaInfo =
              remainingQuota > 0
                ? translate('Message.UploadQuotaInfo', {
                    assetType: `${selectAssetType}`,
                    usage: `${remainingQuota}`,
                    capacity: `${quota.capacity}`,
                    expiry: `${expiry}`,
                  })
                : translate('Message.UploadQuotaReachedInfo', {
                    assetType: `${selectAssetType}`,
                    quota: `${remainingQuota}`,
                    capacity: `${quota.capacity}`,
                    expiry: `${expiry}`,
                  });
            if (remainingQuota <= 0) {
              setDisableUpload(true);
            }
          }
        } else {
          quotaInfo = translate('Message.AssetLimitInfo', {
            assetType: `${selectAssetType}`,
          });
        }
        setQuotaMessage(quotaInfo);
      } catch {
        setQuotaMessage(
          translate('Message.AssetLimitInfo', {
            assetType: `${selectAssetType}`,
          }),
        );
      }
    };
    if (quotaEnabledAssetTypes.includes(selectAssetType)) {
      fetchData();
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
        } else if (
          selectAssetType === Asset.TShirt &&
          !settings.enableServerDrivenTShirtUploadFee
        ) {
          setUploadFee(0);
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
      fetchData(creatorId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @ts-ignore known issue with `react-hook-form`'s typing
  }, [selectAssetType, trackerClient, settings.enableServerDrivenTShirtUploadFee]);

  const handleFileChange = useCallback(
    (file: File | null) => {
      setAssetCreationErrorMsg('');
      setValue('file', file, { shouldValidate: true });
      let fileName = '';
      if (!getFieldState('name').isDirty) {
        fileName = file ? file.name.substring(0, file?.name.lastIndexOf('.')) : '';
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
    router.push(`/dashboard/creations?${queryParams}`);
  }, [router, selectAssetType, getGroupId]);

  const getTranslatedVideoErrorMessages = (msg: string, defaultMessage: string) => {
    switch (true) {
      case /No Video stream is found in the file/i.test(msg):
        return translate('Message.NoVideoStream');
      case /Too many video streams are found in the file/i.test(msg):
        return translate('Message.TooManyVideoStreams');
      case /Too many audio streams are found in the file/i.test(msg):
        return translate('Message.TooManyAudioStreams');
      case /The duration of the file is too long/i.test(msg):
        return translate('Message.DurationTooLong');
      case /The bitrate of the file is too high/i.test(msg):
        return translate('Message.BitrateTooHigh');
      case /Unsupported video codec/i.test(msg):
        return translate('Message.UnsupportedVideoCodec');
      case /Unsupported audio codec/i.test(msg):
        return translate('Message.UnsupportedAudioCodec');
      case /Unsupported video resolution/i.test(msg):
        return translate('Message.UnsupportedVideoResolution');
      case /Unsupported video frame rate/i.test(msg):
        return translate('Message.UnsupportedVideoFrameRate');
      case /Unsupported video pixel format/i.test(msg):
        return translate('Message.UnsupportedVideoPixelFormat');
      case /Unsupported video color space/i.test(msg):
        return translate('Message.UnsupportedVideoColorSpace');
      case /Unsupported audio sample rate/i.test(msg):
        return translate('Message.UnsupportedAudioSampleRate');
      case /Unsupported audio channel count/i.test(msg):
        return translate('Message.UnsupportedAudioChannelCount');
      case /Unsupported audio sample format/i.test(msg):
        return translate('Message.UnsupportedAudioSampleFormat');
      case /File corrupted/i.test(msg):
        return translate('Message.FileCorrupted');
      default:
        return defaultMessage;
    }
  };

  const getTranslatedImageErrorMessages = (msg: string, defaultMessage: string) => {
    if (msg.match(/Invalid image dimensions/i)) {
      return translate('Message.ItemConfigurationBadRequestError');
    }
    if (msg.match(/Invalid image format/i)) {
      return translate('Message.InvalidImageFormat');
    }
    if (msg.match(/Image resolution/i)) {
      return translate('Message.DecalResolutionLimits');
    }
    return defaultMessage;
  };

  const getTranslatedGenericErrorMessages = (msg: string) => {
    if (msg.match(/moderated/i)) {
      return translate('Message.NameOrDescriptionModeratedError');
    }
    if (msg.match(/InsufficientFunds/i)) {
      return translate('Message.InsufficientFunds');
    }
    if (msg.match(/Id( )?Verification/i)) {
      return translate('Message.IdVerification');
    }
    if (msg.match(/Premium/i)) {
      return translate('Message.Premium');
    }
    if (msg.match(/rate limit/i)) {
      return translate('Message.UploadRateLimited');
    }
    if (msg.match(/upload attempt/i)) {
      setDisableUpload(true);
      return translate('Message.UploadAttemptLimitReached');
    }
    if (msg.match(/available quota/i)) {
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
    let message = getTranslatedGenericErrorMessages(msg);
    // Get asset specific error messages
    switch (assetType) {
      case Asset.Decal:
      case Asset.TShirt:
      case Asset.Shirt:
      case Asset.Pants:
        message = getTranslatedImageErrorMessages(msg, message);
        break;
      case Asset.Video:
        message = getTranslatedVideoErrorMessages(msg, message);
        break;
      default:
        break;
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
      // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
      // responsible for triaging issue.
      // eslint-disable-next-line no-unsafe-optional-chaining -- TODO: Codeowners should check this
      const { message } = await r?.json();
      processErrorMessage(message, errorCode, creatorId);
    } catch {
      processErrorMessage('AssetCreationFailed', errorCode, creatorId);
    }
  };

  const pollForCompletedOperation = async (
    operationId: string,
    creatorId: number | undefined,
    currentAttempt: number,
  ) => {
    const operation = await assetsUploadApiClient.getOperationStatus(operationId);
    const isOperationDone = operation?.done ?? false;

    if (
      currentAttempt > assetUploadOperationStatusPollingMaxRetries ||
      (isOperationDone && operation?.error == null)
    ) {
      redirectBack();
      return;
    }
    if (isOperationDone && operation?.error != null) {
      const errorCode = operation?.error?.code ?? HttpStatusCodes.INTERNAL_SERVER_ERROR;
      const message = operation?.error?.message ?? 'AssetCreationFailed';
      processErrorMessage(message, errorCode, creatorId);
      return;
    }
    await new Promise((r) =>
      setTimeout(r, 1000 * assetUploadOperationStatusPollingIntervalSeconds),
    );
    await pollForCompletedOperation(operationId, creatorId, currentAttempt + 1);
  };

  const uploadAsset = useCallback(
    async (file: File, name: string, description: string) => {
      setAssetCreationErrorMsg('');
      setDisableUpload(false);
      const groupId = getGroupId();
      const isGroupUpload = groupId !== null;
      const creator: Creator = isGroupUpload
        ? { groupId: parseInt(groupId.toString(), 10) }
        : { userId: user?.id };
      const creatorId = isGroupUpload ? creator.groupId : creator.userId;
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
        await pollForCompletedOperation(assetUploadOperationId, creatorId ?? undefined, 0);
      } catch (e) {
        await getErrorMessageFromAssetUploadAPI(e, creatorId ?? undefined);
      }
    },
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
    // responsible for triaging issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: Codeowners should check this
    [selectAssetType, user, uploadFee, assetsUploadApiClient, trackerClient],
  );

  const onButtonSubmit: SubmitHandler<AssetUploadFormType> = useCallback(
    async (data) => {
      setIsAssetUploading(true);
      await uploadAsset(data.file!, data.name, data.description);
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
      handleSubmit(onButtonSubmit)();
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

  const creatableAssetTypes: Asset[] = [];

  Object.keys(Asset).forEach((type) => {
    if (isCreateAssetAvailable(type as Asset)) {
      creatableAssetTypes.push(type as Asset);
    }
  });

  const uploadButtonWithRobux = (fee: number) => {
    if (fee > 0) {
      return translate('UploadWithRobux', {
        price: `${fee}`,
      });
    }
    return translate('Action.UploadSimple');
  };

  return (
    <Grid container item classes={{ root: formContainer }}>
      {getGroupId() !== null && <GroupFeaturesStatus />}
      <Grid item XSmall={12} className={formHeading}>
        <Typography variant='h1'>{translate('Heading.CreateAsset')}</Typography>
        <HubMeta
          title={buildTitle(translate('Heading.CreateAsset'))}
          breadcrumb={buildBreadcrumb(
            translate('Heading.Creations'),
            translate('Heading.CreateAsset'),
          )}
        />
      </Grid>
      <Grid item XSmall={12} classes={{ root: SelectionArea }}>
        <AssetSelection
          selectionValue={selectAssetType}
          label={translate('Label.AssetType')}
          translateFunction={assetTypeTranslateFunction}
          listOfInputs={creatableAssetTypes}
          handleChange={handleAssetTypeChange}
        />
        <Grid item XSmall={12} className={formLinks}>
          <Typography variant='body1'>
            <span>
              {selectAssetType === Asset.Audio || selectAssetType === Asset.Video
                ? quotaMessage
                : ''}
            </span>
            <Link
              href={getInfoUrl(selectAssetType)}
              aria-label={`${translate('Message.LearnMore')}`}
              target='_blank'>
              {translate('Message.LearnMore')}
            </Link>
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
        <Grid item XSmall={10} className={inputFormElement}>
          <Divider />
        </Grid>
        <Grid item XSmall={12} classes={{ root: buttonContainer }}>
          <Button
            variant='outlined'
            size='large'
            color='primary'
            onClick={redirectBack}
            disabled={isAssetUploading}>
            {translate('Action.Cancel')}
          </Button>
          <Button
            classes={{ root: createButton }}
            data-testid='upload-asset-button'
            variant='contained'
            size='large'
            onClick={handlePrimaryClick}
            disabled={(!isValidating && !isValid) || disableUpload}
            loading={isAssetUploading}>
            {purchasableAssetTypes.includes(selectAssetType)
              ? uploadButtonWithRobux(uploadFee)
              : translate('Action.UploadSimple')}
          </Button>
          {assetCreationErrorMsg && (
            <Fragment>
              <br />
              <Typography classes={{ root: errorMessageStyles }}>
                {assetCreationErrorMsg}
              </Typography>
            </Fragment>
          )}
        </Grid>
      </Grid>
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
    </Grid>
  );
};

export default CreateAssetForm;
