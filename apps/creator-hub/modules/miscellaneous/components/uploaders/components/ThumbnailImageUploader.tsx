import type { Ref, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState, useImperativeHandle, forwardRef } from 'react';
import { useTranslation } from '@rbx/intl';
import type { ThumbnailTypes, ThumbnailData } from '@rbx/thumbnails';
import { ReturnPolicy, ThumbnailClient, ThumbnailResponseState } from '@rbx/thumbnails';
import {
  BrokenImageOutlinedIcon,
  Typography,
  HourglassEmptyIcon,
  NotInterestedIcon,
  Skeleton,
  Grid,
  InfoOutlinedIcon,
} from '@rbx/ui';
import parseExceptionToString from '@modules/clients/utils/parseExceptionToString';
import { useMetricsMonitoring } from '../../../metricsMonitoring';
import { acceptedImageTypes, imageSize } from '../constants/size';
import FileRejectStatus from '../enums/FileRejectStatus';
import type { FileRejections } from './SingleImageUploader';
import SingleImageUploader from './SingleImageUploader';
import useThumbnailImagUploaderStyles from './ThumbnailImagUploader.styles';

export interface ThumbnailImagUploaderProps {
  onChange: (file: File | null) => void;
  uploadText?: string;
  changeText?: string;
  removeText?: string;
  targetId?: number;
  targetType?: ThumbnailTypes;
  imageUrl?: string;
  targetReturnPolicy?: ReturnPolicy;
  imageType?: string[];
  imageDimensionHeight?: number;
  imageDimensionWidth?: number;
  maxImageSizeMB?: number;
  infoSection1?: ReactNode;
  infoSection2?: ReactNode;
  imageAltText?: string;
  ariaDescribedBy?: string;
  uploadAriaLabel?: string;
  changeAriaLabel?: string;
  removeAriaLabel?: string;
  removeButtonEnabled?: boolean;
  hasRemovableThumbnail?: boolean;
  enableRemovingExistingThumbnail?: boolean;
  onRemoveExistingThumbnail?: () => void;
  disabled?: boolean;
  placeholderImageUrl?: string;
  blockedPlaceholderImageUrl?: string;
  onThumbnailStateChange?: (state: ThumbnailResponseState | null) => void;
}

export type ThumbnailImageUploaderRef = {
  refreshThumbnail: () => Promise<void>;
};

const ThumbnailImageUploader = (
  {
    onChange,
    uploadText,
    changeText,
    removeText,
    targetId,
    targetType,
    imageUrl,
    targetReturnPolicy,
    imageType = acceptedImageTypes,
    imageDimensionHeight,
    imageDimensionWidth,
    maxImageSizeMB,
    infoSection1,
    infoSection2,
    imageAltText,
    ariaDescribedBy,
    uploadAriaLabel,
    changeAriaLabel,
    removeAriaLabel,
    disabled,
    removeButtonEnabled = true,
    hasRemovableThumbnail = false,
    enableRemovingExistingThumbnail = false,
    onRemoveExistingThumbnail,
    placeholderImageUrl,
    blockedPlaceholderImageUrl,
    onThumbnailStateChange,
  }: ThumbnailImagUploaderProps,
  ref: Ref<ThumbnailImageUploaderRef>,
) => {
  const {
    classes: {
      imageStatusContainer,
      statusTextContainer,
      errorMessageText,
      defaultToAutogenThumbnailOnSaveNotice,
    },
  } = useThumbnailImagUploaderStyles();

  const { translate } = useTranslation();
  const { error } = useMetricsMonitoring();
  const [fileErrors, setFileErrors] = useState<FileRejectStatus[] | null>(null);
  const [targetImageInfo, setTargetImageInfo] = useState<ThumbnailData | null>(null);
  const [newImageUrl, setNewImageUrl] = useState<string | null>(imageUrl ?? null);
  const [isTargetImageLoading, setIsTargetImageLoading] = useState<boolean>(false);
  const [hasRemovedExistingThumbnail, setHasRemovedExistingThumbnail] = useState(false);

  const isSavedThumbnailVisible = useMemo(() => {
    if (hasRemovableThumbnail && hasRemovedExistingThumbnail) {
      return false;
    }
    return Boolean(targetId && targetType);
  }, [hasRemovableThumbnail, hasRemovedExistingThumbnail, targetId, targetType]);

  const shouldShowDefaultToAutogenThumbnailOnSaveNotice = useMemo(
    () =>
      enableRemovingExistingThumbnail &&
      hasRemovableThumbnail &&
      hasRemovedExistingThumbnail &&
      !newImageUrl,
    [
      enableRemovingExistingThumbnail,
      hasRemovableThumbnail,
      hasRemovedExistingThumbnail,
      newImageUrl,
    ],
  );

  const showChangeAction = useMemo(
    () => Boolean(newImageUrl) || isSavedThumbnailVisible,
    [newImageUrl, isSavedThumbnailVisible],
  );

  const showRemoveAction = useMemo(
    () =>
      Boolean(newImageUrl) ||
      (enableRemovingExistingThumbnail &&
        isSavedThumbnailVisible &&
        hasRemovableThumbnail &&
        onRemoveExistingThumbnail !== undefined),
    [
      newImageUrl,
      enableRemovingExistingThumbnail,
      isSavedThumbnailVisible,
      hasRemovableThumbnail,
      onRemoveExistingThumbnail,
    ],
  );

  const fileChangeButtonText = useMemo(() => {
    if (showChangeAction) {
      return uploadText ?? translate('Action.Change');
    }
    return changeText ?? translate('Action.Upload');
  }, [showChangeAction, changeText, uploadText, translate]);

  const fileRemoveButtonText = useMemo(() => {
    if (showRemoveAction) {
      return removeText ?? translate('Action.Remove');
    }
    return '';
  }, [showRemoveAction, removeText, translate]);

  const fileChangeAriaLabel = useMemo(() => {
    if (showChangeAction) {
      return uploadAriaLabel ?? translate('Action.ChangeImage');
    }
    return changeAriaLabel ?? translate('Action.Upload');
  }, [showChangeAction, uploadAriaLabel, changeAriaLabel, translate]);

  const fileRemoveAriaLabel = useMemo(() => {
    if (showRemoveAction) {
      return removeAriaLabel ?? translate('Action.RemoveImage');
    }
    return '';
  }, [showRemoveAction, removeAriaLabel, translate]);

  const uploadInfoSection1 = useMemo(() => {
    if (fileErrors && fileErrors.length > 0) {
      return (
        <>
          {fileErrors.map((e) => {
            switch (e) {
              case FileRejectStatus.FileWrongType:
                return (
                  <div key={e} className={errorMessageText}>
                    {translate('Message.WrongFormatError')}
                  </div>
                );
              case FileRejectStatus.FileTooBig:
                return (
                  <div key={e} className={errorMessageText}>
                    {translate('Message.MaxSizeExceededError', {
                      maxFileSize: `${maxImageSizeMB}MB`,
                    })}
                  </div>
                );
              case FileRejectStatus.TooManyFiles:
              default:
                return null;
            }
          })}
        </>
      );
    }
    return (
      infoSection1 ?? (
        <span>
          <span>{`${translate('Label.Format')} ${imageType
            .map((type) => `*.${type}`)
            .join(', ')}`}</span>
          {imageDimensionWidth && imageDimensionHeight && (
            <>
              <br />
              {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string -- "x" is a dimension ratio separator (e.g. 512 x 512), not a word requiring translation */}
              <span>{`${translate(
                'Label.Dimension',
              )} ${imageDimensionWidth} x ${imageDimensionHeight}`}</span>
            </>
          )}
        </span>
      )
    );
  }, [
    translate,
    fileErrors,
    imageDimensionWidth,
    imageDimensionHeight,
    imageType,
    infoSection1,
    errorMessageText,
    maxImageSizeMB,
  ]);

  const uploadInfoSection2 = useMemo(() => {
    if (shouldShowDefaultToAutogenThumbnailOnSaveNotice) {
      return (
        <span
          className={defaultToAutogenThumbnailOnSaveNotice}
          data-testid='default-to-autogen-thumbnail-on-save-notice'>
          <InfoOutlinedIcon color='info' fontSize='small' />
          {translate('Message.DefaultToAutogenThumbnailOnSave')}
        </span>
      );
    }

    if (targetImageInfo) {
      let errorMsg;
      switch (targetImageInfo.state) {
        case ThumbnailResponseState.Blocked:
          if (blockedPlaceholderImageUrl) {
            return null;
          }
          errorMsg = translate('Message.ImageModerated');
          break;
        case ThumbnailResponseState.Completed:
          if (!newImageUrl) {
            return '';
          }
          break;
        case ThumbnailResponseState.Error:
        case ThumbnailResponseState.TemporarilyUnavailable:
          errorMsg = translate('Message.Unavailable');
          break;
        case ThumbnailResponseState.InReview:
        case ThumbnailResponseState.Pending:
        case undefined:
        default:
          errorMsg = null;
      }
      if (errorMsg) {
        return <span className={errorMessageText}>{errorMsg}</span>;
      }
    }

    if (infoSection2 !== undefined) {
      return infoSection2;
    }

    return <span>{translate('Message.Moderation')}</span>;
  }, [
    translate,
    targetImageInfo,
    infoSection2,
    errorMessageText,
    newImageUrl,
    shouldShowDefaultToAutogenThumbnailOnSaveNotice,
    defaultToAutogenThumbnailOnSaveNotice,
    blockedPlaceholderImageUrl,
  ]);

  const getTargetThumbnailData = useCallback(
    async (isRefreshRequired = false) => {
      if (!targetId || !targetType) {
        return;
      }
      setIsTargetImageLoading(true);
      try {
        const getThumbnail = isRefreshRequired
          ? ThumbnailClient.reloadThumbnailImage
          : ThumbnailClient.getThumbnailImage;
        const data = await getThumbnail(
          targetType,
          targetId,
          targetReturnPolicy ?? ReturnPolicy.AutoGenerated,
        );
        setTargetImageInfo(data);
        setIsTargetImageLoading(false);
        onThumbnailStateChange?.(data.state ?? null);
      } catch (e) {
        error(await parseExceptionToString(e));
      }
    },
    [targetType, targetId, targetReturnPolicy, error, onThumbnailStateChange],
  );

  const uploadedImageUrl = useMemo(() => {
    if (newImageUrl) {
      return newImageUrl;
    }
    if (!isSavedThumbnailVisible) {
      return placeholderImageUrl ?? null;
    }
    if (targetImageInfo?.state === ThumbnailResponseState.Blocked) {
      return blockedPlaceholderImageUrl ?? placeholderImageUrl ?? null;
    }
    if (
      targetImageInfo?.state === ThumbnailResponseState.Error ||
      targetImageInfo?.state === ThumbnailResponseState.TemporarilyUnavailable
    ) {
      return placeholderImageUrl ?? null;
    }
    if (targetImageInfo?.state === ThumbnailResponseState.Completed) {
      return targetImageInfo.imageUrl;
    }
    return null;
  }, [
    targetImageInfo,
    newImageUrl,
    isSavedThumbnailVisible,
    placeholderImageUrl,
    blockedPlaceholderImageUrl,
  ]);

  const uploadedImageStateComponent = useMemo(() => {
    if (!isSavedThumbnailVisible) {
      return null;
    }
    if (!targetImageInfo || targetImageInfo.state === ThumbnailResponseState.Completed) {
      return null;
    }
    if (isTargetImageLoading) {
      return <Skeleton variant='rectangular' width={imageSize} height={imageSize} />;
    }
    let statusText = '';
    let statusIcon = null;
    switch (targetImageInfo.state) {
      case ThumbnailResponseState.InReview:
        statusText = translate('Label.InReview');
        statusIcon = <HourglassEmptyIcon fontSize='large' color='secondary' />;
        break;
      case ThumbnailResponseState.Blocked:
        if (blockedPlaceholderImageUrl) {
          return null;
        }
        statusText = translate('Label.Moderated');
        statusIcon = <NotInterestedIcon fontSize='large' color='secondary' />;
        break;
      case ThumbnailResponseState.Error:
      case ThumbnailResponseState.TemporarilyUnavailable:
        statusText = translate('Label.Unavailable');
        statusIcon = <BrokenImageOutlinedIcon fontSize='large' color='secondary' />;
        break;
      case ThumbnailResponseState.Pending:
      case undefined:
      default:
        return null;
    }
    return (
      <Grid container className={imageStatusContainer} justifyContent='center' alignItems='center'>
        <div>
          {statusIcon}
          <Typography variant='smallLabel1' className={statusTextContainer}>
            {statusText}
          </Typography>
        </div>
      </Grid>
    );
  }, [
    targetImageInfo,
    translate,
    imageStatusContainer,
    isTargetImageLoading,
    statusTextContainer,
    isSavedThumbnailVisible,
    blockedPlaceholderImageUrl,
  ]);

  const handleUploadFile = useCallback(
    (file: File) => {
      if (targetImageInfo && targetImageInfo.imageUrl) {
        URL.revokeObjectURL(targetImageInfo.imageUrl);
      }
      const url = URL.createObjectURL(file);
      setNewImageUrl(url);
      setHasRemovedExistingThumbnail(false);
      onChange(file);
      setFileErrors(null);
    },
    [onChange, targetImageInfo],
  );

  const clearLocalImageSelection = useCallback(() => {
    if (newImageUrl) {
      URL.revokeObjectURL(newImageUrl);
    }
    setNewImageUrl(null);
    onChange(null);
    setFileErrors(null);
  }, [newImageUrl, onChange]);

  const handleRemoveFile = useCallback(() => {
    if (newImageUrl) {
      clearLocalImageSelection();
      return;
    }

    if (enableRemovingExistingThumbnail && hasRemovableThumbnail && onRemoveExistingThumbnail) {
      setHasRemovedExistingThumbnail(true);
      onRemoveExistingThumbnail();
    }
  }, [
    newImageUrl,
    clearLocalImageSelection,
    enableRemovingExistingThumbnail,
    hasRemovableThumbnail,
    onRemoveExistingThumbnail,
  ]);

  const handleRejectedImage = useCallback((rejection: FileRejections) => {
    setFileErrors(rejection.errors);
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler -- not fixing lint, this uses setState to set the thumbnail to loading before the data fetch
    void getTargetThumbnailData();
  }, [getTargetThumbnailData]);

  useImperativeHandle(ref, () => ({
    async refreshThumbnail() {
      await getTargetThumbnailData(true);
      clearLocalImageSelection();
      setHasRemovedExistingThumbnail(false);
    },
  }));

  return (
    <SingleImageUploader
      imageAltText={imageAltText}
      ariaDescribedBy={ariaDescribedBy}
      uploadAriaLabel={fileChangeAriaLabel}
      removeAriaLabel={fileRemoveAriaLabel}
      acceptedImageTypes={imageType}
      maxFileSizeMB={maxImageSizeMB}
      imageUrl={uploadedImageUrl ?? null}
      imageComponent={uploadedImageStateComponent}
      uploadText={fileChangeButtonText}
      removeText={fileRemoveButtonText}
      removeButtonEnabled={removeButtonEnabled}
      infoSection1={uploadInfoSection1}
      infoSection2={uploadInfoSection2}
      onChange={handleUploadFile}
      onRemove={handleRemoveFile}
      onReject={handleRejectedImage}
      disabled={disabled}
    />
  );
};

const ThumbnailImageUploaderWithRef = forwardRef(ThumbnailImageUploader);
export default ThumbnailImageUploaderWithRef;
