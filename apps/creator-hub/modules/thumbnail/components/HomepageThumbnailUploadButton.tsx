import React, { FC, memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { Button, CollectionsIcon, Tooltip, TButtonProps, useDialog, Typography } from '@rbx/ui';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useQueryClient } from '@tanstack/react-query';
import {
  getHomepageThumbnailsQueryKey,
  useGetHomepageThumbnailsQuery,
  useUploadMultipleHomepageThumbnailsMutation,
} from '@modules/react-query/thumbnailPersonalization';
import UploadImageFailureDialog from './UploadImageFailureDialog';
import { FileUploaderId, useFileUploader } from '../context/FileUploaderProvider';
import { acceptMimeTypes, maxAllowedThumbnails } from '../constants/homepageThumbnails';

const MaxPerUpload = 5; // max number of thumbnails per upload

type ThumbnailUploadButtonProps = {
  universeId: number;
  showIcon?: boolean;
  size?: TButtonProps['size'];
  variant?: TButtonProps['variant'];
  color?: TButtonProps['color'];
  isUserViewAnalyticsOnly?: boolean;
  onUploadSuccess?: (homepageThumbnailIds: string[]) => void;
};

const HomepageThumbnailUploadButton: FC<ThumbnailUploadButtonProps> = ({
  universeId,
  showIcon,
  isUserViewAnalyticsOnly,
  size = 'small',
  variant = 'outlined',
  color = 'inherit',
  onUploadSuccess,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const queryClient = useQueryClient();
  const { open, close, configure } = useDialog();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { data: thumbnailsData } = useGetHomepageThumbnailsQuery(universeId);
  const { register, openFileBrowser } = useFileUploader();

  const onSuccess = useCallback(
    (thumbnailIds: string[]) => {
      queryClient
        .invalidateQueries(
          { queryKey: getHomepageThumbnailsQueryKey(universeId) },
          { throwOnError: true },
        )
        .then(() => {
          onUploadSuccess?.(thumbnailIds);
        });
    },
    [onUploadSuccess, queryClient, universeId],
  );

  const onError = useCallback(() => {
    configure(
      <UploadImageFailureDialog
        acceptMimeTypes={acceptMimeTypes}
        onCancel={close}
        onConfirm={() => {
          buttonRef.current?.click();
        }}
      />,
    );
    open();
  }, [close, configure, open]);

  const { uploadMultipleThumbnailsForUniverse, isUploading } =
    useUploadMultipleHomepageThumbnailsMutation(universeId, onSuccess, onError);

  const handleChange = useCallback(
    async (files: FileList | null) => {
      if (files === null || files.length === 0) {
        // no file selected, do nothing
        return;
      }

      close();
      uploadMultipleThumbnailsForUniverse(Array.from(files).slice(0, MaxPerUpload));
    },
    [close, uploadMultipleThumbnailsForUniverse],
  );

  const reachedMaxThumbnails =
    thumbnailsData && thumbnailsData.thumbnails.length >= maxAllowedThumbnails;
  const { tooltip, disabled } = useMemo(() => {
    if (isUserViewAnalyticsOnly) {
      return {
        tooltip: translate(
          translationKey('Label.NoPermissionToUpload', TranslationNamespace.PlaceThumbnails),
        ),
        disabled: true,
      };
    }

    if (reachedMaxThumbnails) {
      return {
        tooltip: translate(
          translationKey('Description.MaxThumbnailsReached', TranslationNamespace.PlaceThumbnails),
          { limit: maxAllowedThumbnails.toString() },
        ),
        disabled: true,
      };
    }
    return {
      tooltip: (
        <Typography display='block' variant='tooltip'>
          <div>
            {translate(
              translationKey(
                'Description.UploadHomepageThumbnail.MaxPerUpload',
                TranslationNamespace.PlaceThumbnails,
              ),
              {
                limit: MaxPerUpload.toString(),
              },
            )}
          </div>
          <div>
            {translate(
              translationKey(
                'Description.UploadHomepageThumbnail.Format',
                TranslationNamespace.PlaceThumbnails,
              ),
              {
                formats: acceptMimeTypes.map((mime) => `*.${mime.split('/')[1]}`).join(', '),
              },
            )}
          </div>
          <div>
            {translate(
              translationKey(
                'Description.UploadHomepageThumbnail.Size',
                TranslationNamespace.PlaceThumbnails,
              ),
            )}
          </div>
          <div>
            {translate(
              translationKey(
                'Description.UploadHomepageThumbnail.Ratio',
                TranslationNamespace.PlaceThumbnails,
              ),
            )}
          </div>
        </Typography>
      ),
      disabled: false,
    };
  }, [isUserViewAnalyticsOnly, reachedMaxThumbnails, translate]);

  useEffect(() => {
    return register(FileUploaderId.HomepageThumbnail, {
      acceptMimeTypes,
      handleChange,
      allowMultiple: true,
    });
  }, [handleChange, register]);

  const onClick = useCallback(() => {
    openFileBrowser(FileUploaderId.HomepageThumbnail);
  }, [openFileBrowser]);

  return (
    <Tooltip title={tooltip} arrow placement='right'>
      {/** Need to wrap Button with a <span> element because
       * Tooltip component does not work on a disabled button with pointer-event: none
       */}
      <span style={{ display: 'inline-block' }}>
        <Button
          ref={buttonRef}
          startIcon={showIcon ? <CollectionsIcon fontSize='small' /> : undefined}
          variant={variant}
          color={color}
          size={size}
          onClick={onClick}
          loading={isUploading}
          disabled={disabled}
          disableRipple>
          {translate(
            translationKey('Label.Action.UploadImages', TranslationNamespace.PlaceThumbnails),
          )}
        </Button>
      </span>
    </Tooltip>
  );
};

export default memo(HomepageThumbnailUploadButton);
