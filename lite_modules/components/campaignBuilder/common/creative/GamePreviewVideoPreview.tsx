import { Icon } from '@rbx/foundation-ui';
import { RobloxVideoPlayer } from '@rbx/video-player';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import useCreativesStyles from '@components/campaignBuilder/common/creative/Creatives.styles';
import { openGamePreviewVideoDialog } from '@components/common/dialogs/GamePreviewVideoDialog';
import Skeleton from '@components/common/Skeleton';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { getSponsoredUniverseGamePreviewVideo } from '@services/ads/getSponsoredUniverseGamePreviewVideoService';
import { CaptureException } from '@utils/error';
import { GetVideoPlayerEnvEnum } from '@utils/url';

interface GamePreviewVideoPreviewProps {
  isEnabled: boolean;
  universeId?: number;
}

const GamePreviewVideoPreview = ({ isEnabled, universeId }: GamePreviewVideoPreviewProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: {
      videoErrorContainer,
      videoPreviewIconOverlay,
      videoUploadContainer,
      videoUploadContainerClickable,
      videoUploadThumbnail,
    },
  } = useCreativesStyles();
  const [failedVideoAssetId, setFailedVideoAssetId] = useState<number>();
  const { data, isError, isLoading } = useQuery({
    enabled: isEnabled && universeId !== undefined,
    queryFn: () => getSponsoredUniverseGamePreviewVideo(universeId!),
    queryKey: ['sponsoredUniverseGamePreviewVideo', universeId],
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    staleTime: 0,
  });

  if (!isEnabled || universeId === undefined) {
    return null;
  }

  if (isLoading) {
    return <Skeleton className='height-[90px] width-[160px]' variant='rectangular' />;
  }

  if (isError) {
    return null;
  }

  const videoAssetId = data?.video_asset_id;
  if (videoAssetId === undefined) {
    return null;
  }

  const hasLoadError = failedVideoAssetId === videoAssetId;
  const openPreview = () => openGamePreviewVideoDialog(String(videoAssetId));

  return (
    <div className='flex flex-col gap-small'>
      <p
        className='margin-[0px] text-title-small content-emphasis'
        data-testid='game-preview-video-label'>
        {translate('Label.VideoAsset')}
      </p>
      {hasLoadError ? (
        <div className={videoUploadContainer} data-testid='game-preview-video-unavailable'>
          <div className={videoErrorContainer} role='status'>
            {translate('Description.VideoPreviewUnavailable')}
          </div>
        </div>
      ) : (
        <div
          aria-label={translate('Action.PlayVideo')}
          className={videoUploadContainerClickable}
          data-testid='game-preview-video-preview'
          onClick={openPreview}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openPreview();
            }
          }}
          role='button'
          tabIndex={0}>
          <RobloxVideoPlayer
            className={videoUploadThumbnail}
            disableControls
            environment={GetVideoPlayerEnvEnum()}
            muted
            onLoadError={(error) => {
              CaptureException(error, {
                context: 'Failed to load sponsored universe game preview video thumbnail',
                videoAssetId,
              });
              setFailedVideoAssetId(videoAssetId);
            }}
            videoAssetId={String(videoAssetId)}
          />
          <span aria-hidden className={videoPreviewIconOverlay}>
            <Icon
              data-testid='video-preview-icon'
              name='icon-regular-magnifying-glass'
              size='Medium'
            />
          </span>
        </div>
      )}
    </div>
  );
};

export default GamePreviewVideoPreview;
