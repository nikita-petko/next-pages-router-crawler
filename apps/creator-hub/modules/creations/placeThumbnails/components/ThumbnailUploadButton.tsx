import { FC, useCallback, useEffect, useRef } from 'react';
import { Button, CollectionsIcon, Tooltip, useDialog } from '@rbx/ui';
import {
  FormattedText,
  translationKey,
  useTranslationWrapper,
} from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useQueryClient } from '@tanstack/react-query';
import { AssetType } from '@rbx/clients/assetsUploadApi';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { FileUploaderId, useFileUploader } from '@modules/thumbnail/context/FileUploaderProvider';
import UploadImageFailureDialog from '@modules/thumbnail/components/UploadImageFailureDialog';
import useUploadAssetForPlaceMutation from '../hooks/useUploadAssetForPlaceMutation';
import { getPlaceMediaQueryKey } from '../hooks/useGetPlaceMediaQuery';

const acceptMimeTypes = ['image/jpeg', 'image/gif', 'image/png', 'image/tga', 'image/bmp'];

type ThumbnailUploadButtonProps = {
  placeId: number;
  userId: number;
  onUploadStatusChange: (isUploading: boolean) => void;
  disabled?: boolean;
  tooltip?: FormattedText;
};

const ThumbnailUploadButton: FC<ThumbnailUploadButtonProps> = ({
  placeId,
  userId,
  disabled,
  tooltip,
  onUploadStatusChange,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const queryClient = useQueryClient();
  const { open, close, configure } = useDialog();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { register, openFileBrowser } = useFileUploader();
  const { gameDetails } = useCurrentGame();

  const onSuccess = useCallback(() => {
    onUploadStatusChange(false);
    queryClient.invalidateQueries({ queryKey: getPlaceMediaQueryKey(placeId) });
  }, [onUploadStatusChange, placeId, queryClient]);

  const onError = useCallback(() => {
    onUploadStatusChange(false);
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
  }, [close, configure, onUploadStatusChange, open]);

  const creatorType = gameDetails?.creator?.type;
  const isGroupUpload = creatorType === 'Group';
  const groupId = gameDetails?.creator?.id;

  const { uploadAssetForPlace, isUploading } = useUploadAssetForPlaceMutation(
    placeId,
    userId,
    groupId,
    isGroupUpload,
    onSuccess,
    onError,
  );

  const handleChange = useCallback(
    async (files: FileList | null) => {
      if (files === null || files.length === 0) {
        // no file selected, do nothing
        return;
      }

      close();

      onUploadStatusChange(true);
      // Image doesn't cost robox hence price of 0.
      uploadAssetForPlace({ file: files[0], assetType: AssetType.Image, price: 0 });
    },
    [close, onUploadStatusChange, uploadAssetForPlace],
  );

  useEffect(() => {
    return register(FileUploaderId.ExperienceDetailPageThumbnail, {
      acceptMimeTypes,
      handleChange,
    });
  }, [handleChange, register]);

  const onClick = useCallback(() => {
    openFileBrowser(FileUploaderId.ExperienceDetailPageThumbnail);
  }, [openFileBrowser]);

  return (
    <Tooltip title={tooltip} arrow placement='top'>
      {/** Need to wrap Button with a <span> element because
       * Tooltip component does not work on a disabled button with pointer-event: none
       */}
      <span style={{ display: 'inline-block' }}>
        <Button
          ref={buttonRef}
          startIcon={<CollectionsIcon fontSize='small' />}
          variant='contained'
          color='secondary'
          disableRipple
          onClick={onClick}
          loading={isUploading}
          disabled={disabled}>
          {translate(
            translationKey('Label.Action.UploadImage', TranslationNamespace.PlaceThumbnails),
          )}
        </Button>
      </span>
    </Tooltip>
  );
};

export default ThumbnailUploadButton;
