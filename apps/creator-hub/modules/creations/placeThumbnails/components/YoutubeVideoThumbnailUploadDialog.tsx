import React, { FC, useState, useCallback, useMemo, useEffect } from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  DialogActions,
  Button,
  RobuxIcon,
  Alert,
} from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/common/components';
import { useTranslation, withTranslation } from '@rbx/intl';
import { AssetType } from '@rbx/clients/assetsUploadApi';
import { useQueryClient } from '@tanstack/react-query';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import useUploadAssetForPlaceMutation, {
  PollingConfig,
} from '../hooks/useUploadAssetForPlaceMutation';
import { getUserBalanceQueryKey } from '../hooks/useGetUserBalanceQuery';
import { getPlaceMediaQueryKey } from '../hooks/useGetPlaceMediaQuery';

type VideoUploadDialogProps = {
  placeId: number;
  userId: number;
  userBalance: number;
  videoThumbnailPrice: number;
  onClose: () => void;
  groupId: number | undefined;
  isGroupUpload: boolean;
};

const YoutubeVideoThumbnailUploadDialog: FC<VideoUploadDialogProps> = ({
  onClose: onCloseGiven,
  videoThumbnailPrice,
  userBalance,
  placeId,
  userId,
  groupId,
  isGroupUpload,
}) => {
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const queryClient = useQueryClient();

  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const onVideoUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrl(e.target.value);
    setUploadErrorMsg(null);
  }, []);

  const onClose = useCallback(() => {
    setVideoUrl(null);
    setUploadErrorMsg(null);
    onCloseGiven();
  }, [onCloseGiven]);

  const onSuccessUpload = useCallback(() => {
    // invalidate user balance query to update the balance upon successful upload
    queryClient.invalidateQueries({ queryKey: getUserBalanceQueryKey(userId) });
    // invalidae place media query to update the media list upon successful upload
    queryClient.invalidateQueries({ queryKey: getPlaceMediaQueryKey(placeId) });
    onClose();
  }, [onClose, placeId, queryClient, userId]);

  const onErrorUpload = useCallback((msg: string) => {
    setUploadErrorMsg(msg);
  }, []);

  const {
    isYoutubeVideoThumbnailUpload5MinPollingEnabled,
    isYoutubeVideoThumbnailUpload15MinPollingEnabled,
    isYoutubeVideoThumbnailUpload30MinPollingEnabled,
    isYoutubeVideoThumbnailUpload60MinPollingEnabled,
  } = useFeatureFlagsForNamespace(
    [
      'isYoutubeVideoThumbnailUpload5MinPollingEnabled',
      'isYoutubeVideoThumbnailUpload15MinPollingEnabled',
      'isYoutubeVideoThumbnailUpload30MinPollingEnabled',
      'isYoutubeVideoThumbnailUpload60MinPollingEnabled',
    ] as const,
    FeatureFlagNamespace.Analytics,
  );
  const pollingConfig: PollingConfig | undefined = useMemo(() => {
    if (isYoutubeVideoThumbnailUpload60MinPollingEnabled) {
      return {
        maxPolls: 3600,
        pollInterval: 1000,
      };
    }
    if (isYoutubeVideoThumbnailUpload30MinPollingEnabled) {
      return {
        maxPolls: 1800,
        pollInterval: 1000,
      };
    }
    if (isYoutubeVideoThumbnailUpload15MinPollingEnabled) {
      return {
        maxPolls: 900,
        pollInterval: 1000,
      };
    }
    if (isYoutubeVideoThumbnailUpload5MinPollingEnabled) {
      return {
        maxPolls: 300,
        pollInterval: 1000,
      };
    }
    return undefined;
  }, [
    isYoutubeVideoThumbnailUpload15MinPollingEnabled,
    isYoutubeVideoThumbnailUpload30MinPollingEnabled,
    isYoutubeVideoThumbnailUpload5MinPollingEnabled,
    isYoutubeVideoThumbnailUpload60MinPollingEnabled,
  ]);

  const { uploadAssetForPlace, isUploading } = useUploadAssetForPlaceMutation(
    placeId,
    userId,
    groupId,
    isGroupUpload,
    onSuccessUpload,
    onErrorUpload,
    pollingConfig ? false : undefined, // isMultipartUpload
    pollingConfig,
  );
  const onUpload = useCallback(() => {
    if (!videoUrl) {
      return;
    }

    const videoUrlBlob = new Blob([videoUrl.toString()], { type: 'text/plain' });
    const file = new File([videoUrlBlob], 'foo.txt', { type: 'text/plain' });
    uploadAssetForPlace({
      file,
      assetType: AssetType.YoutubeVideo,
      price: videoThumbnailPrice,
    });
  }, [uploadAssetForPlace, videoThumbnailPrice, videoUrl]);

  const showErrorAlert = !!uploadErrorMsg;
  const errorAlert = useMemo(() => {
    return showErrorAlert ? (
      <Alert severity='error' variant='standard' style={{ marginTop: '16px' }}>
        {uploadErrorMsg}
      </Alert>
    ) : null;
  }, [showErrorAlert, uploadErrorMsg]);

  const showInfoAlert = !showErrorAlert && videoUrl;
  const infoAlert = useMemo(() => {
    return showInfoAlert ? (
      <Alert severity='info' variant='standard' style={{ marginTop: '16px' }}>
        <Flex>
          {translate(
            translationKey(
              'Description.BuyThumbnailInfoAlert',
              TranslationNamespace.PlaceThumbnails,
            ),
          )}
          &nbsp;
          <RobuxIcon />
          &nbsp;{videoThumbnailPrice}
        </Flex>
        <Flex alignItems='center'>
          {translate(translationKey('Label.CurrentBalance', TranslationNamespace.PlaceThumbnails))}
          &nbsp;
          <RobuxIcon />
          &nbsp;{userBalance}
        </Flex>
      </Alert>
    ) : null;
  }, [showInfoAlert, translate, userBalance, videoThumbnailPrice]);

  // Prevent the dialog from closing when clicking outside or pressing escape key while uploading
  useEffect(() => {
    function stopPropagation(e: Event) {
      e.stopImmediatePropagation();
    }

    if (isUploading) {
      window.addEventListener('click', stopPropagation, { capture: true });
      window.addEventListener('keydown', stopPropagation, { capture: true });
    }

    return () => {
      if (isUploading) {
        window.removeEventListener('click', stopPropagation, { capture: true });
        window.removeEventListener('keydown', stopPropagation, { capture: true });
      }
    };
  }, [isUploading]);

  return (
    <div>
      <DialogTitle>
        {translate(translationKey('Label.UploadVideo', TranslationNamespace.PlaceThumbnails))}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id='dialog-content-text-describe-id' marginBottom='20px'>
          {translate(
            translationKey(
              'Description.VideoUploadModeration',
              TranslationNamespace.PlaceThumbnails,
            ),
          )}
        </DialogContentText>
        <TextField
          label={translate(
            translationKey('Label.YouTubeURL', TranslationNamespace.PlaceThumbnails),
          )}
          id='upload_video'
          onChange={onVideoUrlChange}
          disabled={isUploading}
          fullWidth
        />
        {infoAlert}
        {errorAlert}
      </DialogContent>
      <DialogActions>
        <Button
          size='large'
          variant='outlined'
          aria-label='cancel'
          color='secondary'
          onClick={onClose}
          disabled={isUploading}>
          {translate(translationKey('Action.Cancel', TranslationNamespace.Controls))}
        </Button>
        <Button
          size='large'
          variant='contained'
          aria-label='save'
          color='primaryBrand'
          disabled={!videoUrl}
          loading={isUploading}
          onClick={onUpload}>
          {translateHTML(translationKey('Action.AddVideo', TranslationNamespace.Controls), [
            {
              opening: 'priceStart',
              closing: 'priceEnd',
              content: () => (
                <React.Fragment>
                  <RobuxIcon /> {videoThumbnailPrice}
                </React.Fragment>
              ),
            },
          ])}
        </Button>
      </DialogActions>
    </div>
  );
};

export default withTranslation(YoutubeVideoThumbnailUploadDialog, [
  TranslationNamespace.Controls,
  TranslationNamespace.PlaceThumbnails,
  TranslationNamespace.Analytics,
  TranslationNamespace.Error,
]);
