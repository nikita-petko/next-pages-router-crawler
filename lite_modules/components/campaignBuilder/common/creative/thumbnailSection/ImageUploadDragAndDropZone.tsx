import { Button } from '@rbx/foundation-ui';
import { FormHelperText } from '@rbx/ui';
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { EventName, logNativeClickEvent, logNativeErrorEvent } from '@clients/unifiedLogger';
import useCreativeUploadDragAndDropZoneStyles from '@components/campaignBuilder/common/creative/thumbnailSection/ImageUploadDragAndDropZone.styles';
import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import { IMAGE_ACCEPT_FORMATS } from '@constants/fileUpload';
import { TranslationNamespace } from '@constants/localization';
import { useAuthenticatedUser } from '@hooks/useAuthenticatedUser';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { useThumbnailStore } from '@stores/thumbnailStoreProvider';
import { AspectRatioValidation, CancelImageUpload, SetUploadedImageParams } from '@type/fileUpload';
import { OnFileUpload } from '@utils/fileUpload';

type StringBooleanRecord = Record<string, boolean>;

interface ImageUploadDragAndDropZoneProps {
  /** Aspect ratio validation rules */
  aspectRatioValidation?: AspectRatioValidation;
  /** Optional function to get current count of uploaded assets */
  getCurrentUploadedCount?: () => number;
  /** Helper text lines to display */
  helperTextLines: string[];
  /** Optional maximum allowed uploads */
  maxAllowedUploads?: number;
  /** Callback when asset is successfully uploaded */
  onAssetUploaded: (params: SetUploadedImageParams) => void;
  /** Text for the upload button */
  uploadButtonText: string;
  /** Text shown while uploading */
  uploadingText: string;
}

const ImageUploadDragAndDropZone = ({
  aspectRatioValidation,
  getCurrentUploadedCount,
  helperTextLines,
  maxAllowedUploads,
  onAssetUploaded,
  uploadButtonText,
  uploadingText,
}: ImageUploadDragAndDropZoneProps) => {
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const {
    classes: {
      circularProgress,
      configureAdRow,
      customHelperText,
      dragActiveBackground,
      dragErrorBorder,
      hidden,
      progressContainer,
      uploadContainer,
      uploadErrorText,
      uploadHelperText,
      uploadMediaButton,
    },
    cx,
  } = useCreativeUploadDragAndDropZoneStyles();
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [imagesUploading, setImagesUploading] = useState<StringBooleanRecord>({});
  const [imagesPendingCancellation, setImagesPendingCancellation] = useState<StringBooleanRecord>(
    {},
  );
  const [cancelImagesUpload, setCancelImagesUpload] = useState<CancelImageUpload>({});
  const { setBlobByAssetId } = useThumbnailStore();
  const [errorMessage, setErrorMessage] = useState<string>('');

  const setStoreImageUploading = useCampaignBuilderStore((state) => state.setImageUploading);

  const countUploading = Object.values(imagesUploading).filter((isUploading) => isUploading).length;
  const isUploading = countUploading > 0;

  const authenticatedUser = useAuthenticatedUser();
  const inputFile = useRef<HTMLInputElement>(null);

  const setUploadedImage = ({ aspectRatio, assetId, blob, image }: SetUploadedImageParams) => {
    setBlobByAssetId(assetId, image);
    onAssetUploaded({ aspectRatio, assetId, blob, image });
    setBlobByAssetId(assetId, blob);
  };

  const clearPreviouslyUploadedInfo = () => {
    if (inputFile && inputFile.current) {
      inputFile.current.value = '';
    }
  };

  const openFileUploadSystemDialog = () => {
    if (isUploading) {
      return;
    }

    if (inputFile && inputFile.current) {
      clearPreviouslyUploadedInfo();

      inputFile.current.click();
    }
  };

  const setCancelImageUpload = (id: string, cancel: () => void) => {
    setCancelImagesUpload((prev) => ({ ...prev, [id]: cancel }));
  };

  useEffect(() => {
    const nextSetImagesPendingCancellation = { ...imagesPendingCancellation };
    Object.keys(imagesPendingCancellation).forEach((id) => {
      if (cancelImagesUpload[id]) {
        cancelImagesUpload[id]();
        delete nextSetImagesPendingCancellation[id];
      }
    });
    if (
      Object.keys(nextSetImagesPendingCancellation).length !==
      Object.keys(imagesPendingCancellation).length
    ) {
      setImagesPendingCancellation(nextSetImagesPendingCancellation);
    }
  }, [cancelImagesUpload]); // eslint-disable-line react-hooks/exhaustive-deps

  const setImageUploading = (id: string, uploading: boolean) => {
    setStoreImageUploading(id, uploading);
    setImagesUploading((prev) => ({ ...prev, [id]: uploading }));
  };

  const setErrorMessageAndLog = (err: string) => {
    setErrorMessage(err);
    if (err) {
      logNativeErrorEvent({
        error: err,
        eventName: EventName.AssetUploadFailed,
      });
    }
  };

  const OnFileUploadError = (id: string, err: string) => {
    setErrorMessageAndLog(err);
    setImageUploading(id, false);
    if (cancelImagesUpload[id]) {
      cancelImagesUpload[id]();
    }
  };

  const cancelAllPendingUploads = () => {
    Object.keys(imagesUploading).forEach((id) => {
      if (imagesUploading[id] && cancelImagesUpload[id]) {
        cancelImagesUpload[id]();
      } else {
        setImagesPendingCancellation((prev) => ({ ...prev, [id]: true })); // if the user cancels before the callback is set
      }
    });
  };

  const uploadFile = (image: File) => {
    OnFileUpload({
      aspectRatioValidation,
      authenticatedUser,
      id: uuidv4(),
      image,
      OnFileUploadError,
      setCancelImageUpload,
      setImageUploading,
      setUploadedImage,
    });
  };

  const uploadFiles = (filesToUpload: File[]) => {
    // Calculate allowed count
    let allowedCount = filesToUpload.length;
    if (maxAllowedUploads !== undefined && getCurrentUploadedCount) {
      const currentCount = getCurrentUploadedCount();
      allowedCount = maxAllowedUploads - countUploading - currentCount;
      if (filesToUpload.length > allowedCount) {
        setErrorMessageAndLog(
          translateCampaign('Description.UploadLimit', { max: String(maxAllowedUploads) }),
        );
      }
    }

    if (filesToUpload.length > 0 && allowedCount > 0) {
      setErrorMessage('');
    }

    filesToUpload.slice(0, Math.max(0, allowedCount)).forEach((file) => uploadFile(file));
  };

  const OnFileUploadClick = (e: ChangeEvent<HTMLInputElement>) => {
    if (!authenticatedUser && !authenticatedUser!.id) {
      // TODO: Show an error modal prompting the user to login in a new tab
      return;
    }

    if (!e.target.files?.length) {
      return;
    }
    const files = Array.from(e.target.files);
    logNativeClickEvent(EventName.AssetUploadRequested, {
      action: 'click',
      count: files.length.toString(),
    });
    uploadFiles(files);
  };

  const OnFileUploadDrag = (e: DragEvent<HTMLDivElement>) => {
    if (!authenticatedUser && !authenticatedUser!.id) {
      // TODO: Show an error modal prompting the user to login in a new tab
      return;
    }

    const files = Array.from(e.dataTransfer?.files || []);
    logNativeClickEvent(EventName.AssetUploadRequested, {
      action: 'drag',
      count: files.length.toString(),
    });
    uploadFiles(files);
  };

  // handle drag events
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    if (isUploading) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (isUploading) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      OnFileUploadDrag(e);
    }
  };

  return (
    <div>
      <div>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}>
          <label htmlFor='input-file-upload' id='label-file-upload'>
            <input
              accept={IMAGE_ACCEPT_FORMATS}
              className={hidden}
              data-testid='file-upload-input'
              disabled={isUploading}
              hidden
              id='input-file-upload'
              multiple
              onChange={OnFileUploadClick}
              ref={inputFile}
              type='file'
            />
            <div
              className={cx(uploadContainer, {
                [dragActiveBackground]: dragActive,
                [dragErrorBorder]: !!errorMessage,
              })}
              data-testid='upload-container'
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              role='none'>
              {Boolean(isUploading) && (
                <div className={progressContainer}>
                  <CenteredCircularProgress className={circularProgress} />
                  {uploadingText}
                  <Button
                    onClick={() => {
                      cancelAllPendingUploads();
                    }}
                    size='Medium'
                    variant='Standard'>
                    {translateMisc('Action.Cancel')}
                  </Button>
                </div>
              )}
              {!isUploading && (
                <>
                  <div className={configureAdRow}>
                    <Button
                      className={uploadMediaButton}
                      icon='icon-regular-arrow-up-from-line'
                      id='fileSelect'
                      onClick={openFileUploadSystemDialog}
                      size='Medium'
                      variant='Standard'>
                      {uploadButtonText}
                    </Button>
                  </div>
                  {helperTextLines.map((text) => (
                    <div className={cx(uploadHelperText)} key={text}>
                      <span className='text-body-medium content-default'>{text}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </label>
        </div>
        <span className={`text-body-large content-system-alert ${uploadErrorText}`}>
          {errorMessage}
        </span>
        <FormHelperText classes={{ root: customHelperText }}>
          <span className='text-body-medium'>
            {translateCampaign('Description.SupportedImageFormats')}
          </span>
        </FormHelperText>
      </div>
    </div>
  );
};

export default ImageUploadDragAndDropZone;
