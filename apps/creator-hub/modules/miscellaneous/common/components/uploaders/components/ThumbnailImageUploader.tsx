import React, {
  Fragment,
  Ref,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  ThumbnailTypes,
  ReturnPolicy,
  ThumbnailClient,
  ThumbnailResponseState,
  ThumbnailData,
} from '@rbx/thumbnails';
import {
  BrokenImageOutlinedIcon,
  Typography,
  HourglassEmptyIcon,
  NotInterestedIcon,
  Skeleton,
  Grid,
} from '@rbx/ui';
import { parseExceptionToString } from '@modules/clients';
import { useTranslation } from '@rbx/intl';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import FileRejectStatus from '../enums/FileRejectStatus';
import { acceptedImageTypes, imageSize } from '../constants/size';
import SingleImageUploader, { FileRejections } from './SingleImageUploader';
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
  disabled?: boolean;
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
  }: ThumbnailImagUploaderProps,
  ref: Ref<ThumbnailImageUploaderRef>,
) => {
  const {
    classes: { imageStatusContainer, statusTextContainer, errorMessageText },
  } = useThumbnailImagUploaderStyles();

  const { translate } = useTranslation();
  const { error } = useMetricsMonitoring();
  const [fileErrors, setFileErrors] = useState<FileRejectStatus[] | null>(null);
  const [targetImageInfo, setTargetImageInfo] = useState<ThumbnailData | null>(null);
  const [newImageUrl, setNewImageUrl] = useState<string | null>(imageUrl ?? null);
  const [isTargetImageLoading, setIsTargetImageLoading] = useState<boolean>(false);

  const fileChangeButtonText = useMemo(() => {
    if (newImageUrl || (targetId && targetType)) {
      return uploadText || translate('Action.Change');
    }
    return changeText || translate('Action.Upload');
  }, [targetId, targetType, newImageUrl, changeText, uploadText, translate]);

  const fileRemoveButtonText = useMemo(() => {
    if (newImageUrl) {
      return removeText || translate('Action.Remove');
    }
    return '';
  }, [newImageUrl, removeText, translate]);

  const fileChangeAriaLabel = useMemo(() => {
    if (newImageUrl || (targetId && targetType)) {
      return uploadAriaLabel || translate('Action.ChangeImage');
    }
    return changeAriaLabel || translate('Action.Upload');
  }, [targetId, targetType, newImageUrl, uploadAriaLabel, changeAriaLabel, translate]);

  const fileRemoveAriaLabel = useMemo(() => {
    if (newImageUrl) {
      return removeAriaLabel || translate('Action.RemoveImage');
    }
    return '';
  }, [newImageUrl, removeAriaLabel, translate]);

  const uploadInfoSection1 = useMemo(() => {
    if (fileErrors && fileErrors.length > 0) {
      return (
        <Fragment>
          {fileErrors.map((e) => {
            switch (e) {
              case FileRejectStatus.FileWrongType:
                return (
                  <div className={errorMessageText}>{translate('Message.WrongFormatError')}</div>
                );
              case FileRejectStatus.FileTooBig:
                return (
                  <div className={errorMessageText}>
                    {translate('Message.MaxSizeExceededError', {
                      maxFileSize: `${maxImageSizeMB}MB`,
                    })}
                  </div>
                );
              default:
                return null;
            }
          })}
        </Fragment>
      );
    }
    return (
      infoSection1 || (
        <span>
          <span>{`${translate('Label.Format')} ${imageType
            .map((type) => `*.${type}`)
            .join(', ')}`}</span>
          {imageDimensionWidth && imageDimensionHeight && (
            <Fragment>
              <br />
              <span>{`${translate(
                'Label.Dimension',
              )} ${imageDimensionWidth} x ${imageDimensionHeight}`}</span>
            </Fragment>
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
    if (targetImageInfo) {
      let errorMsg;
      switch (targetImageInfo.state) {
        case ThumbnailResponseState.Blocked:
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
        default:
          errorMsg = null;
      }
      if (errorMsg) {
        return <span className={errorMessageText}>{errorMsg}</span>;
      }
    }
    return infoSection2 || <span>{translate('Message.Moderation')}</span>;
  }, [translate, targetImageInfo, infoSection2, errorMessageText, newImageUrl]);

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
          targetReturnPolicy || ReturnPolicy.AutoGenerated,
        );
        setTargetImageInfo(data);
        setIsTargetImageLoading(false);
      } catch (e) {
        error(await parseExceptionToString(e));
      }
    },
    [targetType, targetId, targetReturnPolicy, error],
  );

  const uploadedImageUrl = useMemo(() => {
    if (newImageUrl) {
      return newImageUrl;
    }
    if (targetImageInfo && targetImageInfo.state === ThumbnailResponseState.Completed) {
      return targetImageInfo.imageUrl;
    }
    return null;
  }, [targetImageInfo, newImageUrl]);

  const uploadedImageStateComponent = useMemo(() => {
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
        statusText = translate('Label.Moderated');
        statusIcon = <NotInterestedIcon fontSize='large' color='secondary' />;
        break;
      case ThumbnailResponseState.Error:
      case ThumbnailResponseState.TemporarilyUnavailable:
        statusText = translate('Label.Unavailable');
        statusIcon = <BrokenImageOutlinedIcon fontSize='large' color='secondary' />;
        break;
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
  }, [targetImageInfo, translate, imageStatusContainer, isTargetImageLoading, statusTextContainer]);

  const handleUploadFile = useCallback(
    (file: File) => {
      if (targetImageInfo && targetImageInfo.imageUrl) {
        URL.revokeObjectURL(targetImageInfo.imageUrl);
      }
      const url = URL.createObjectURL(file);
      setNewImageUrl(url);
      onChange(file);
      setFileErrors(null);
    },
    [onChange, targetImageInfo],
  );

  const handleRemoveFile = useCallback(() => {
    if (targetImageInfo && targetImageInfo.imageUrl) {
      URL.revokeObjectURL(targetImageInfo.imageUrl);
    }
    setNewImageUrl(null);
    onChange(null);
    setFileErrors(null);
  }, [onChange, targetImageInfo]);

  const handleRejectedImage = useCallback((rejection: FileRejections) => {
    setFileErrors(rejection.errors);
  }, []);

  useEffect(() => {
    getTargetThumbnailData();
  }, [getTargetThumbnailData]);

  useImperativeHandle(ref, () => ({
    async refreshThumbnail() {
      await getTargetThumbnailData(true);
      return handleRemoveFile();
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
