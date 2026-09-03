import { Button, Icon } from '@rbx/foundation-ui';
import { RobloxVideoPlayer } from '@rbx/video-player';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { openGamePreviewVideoDialog } from '@components/common/dialogs/GamePreviewVideoDialog';
import styles from '@components/reporting/CampaignGamePreviewVideoBanner.module.css';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { getSimplifiedCampaign } from '@services/ads/getEntitiesService';
import { getSponsoredUniverseGamePreviewVideo } from '@services/ads/getSponsoredUniverseGamePreviewVideoService';
import { useAppStore } from '@stores/appStoreProvider';
import { CaptureException } from '@utils/error';
import { GetVideoPlayerEnvEnum } from '@utils/url';

interface CampaignGamePreviewVideoBannerProps {
  campaignId: string;
}

const CampaignGamePreviewVideoBanner = ({ campaignId }: CampaignGamePreviewVideoBannerProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const isSponsoredVideoTilesEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isSponsoredVideoTilesEnabled ?? false,
  );
  const [failedVideoAssetId, setFailedVideoAssetId] = useState<number>();
  const { data: universeId } = useQuery({
    enabled: isSponsoredVideoTilesEnabled,
    queryFn: () => getSimplifiedCampaign(campaignId),
    queryKey: ['campaignGamePreviewVideoConfig', campaignId],
    select: ({ campaign }) =>
      campaign.video_config?.organic_gpv !== undefined ? campaign.target_universe_id : undefined,
    staleTime: Infinity,
  });
  const { data: gamePreviewVideo } = useQuery({
    enabled: isSponsoredVideoTilesEnabled && universeId !== undefined,
    queryFn: () => getSponsoredUniverseGamePreviewVideo(universeId!),
    queryKey: ['sponsoredUniverseGamePreviewVideo', universeId],
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    staleTime: 0,
  });

  const videoAssetId = gamePreviewVideo?.video_asset_id;
  if (videoAssetId === undefined) {
    return null;
  }
  const hasLoadError = failedVideoAssetId === videoAssetId;

  return (
    <div
      className='flex width-full min-width-0 items-center gap-medium margin-bottom-medium padding-x-xlarge padding-y-small radius-medium stroke-standard stroke-default'
      data-testid='game-preview-video-campaign-banner'>
      <div className='flex height-1600 width-1600 shrink-0 items-center justify-center'>
        {hasLoadError ? (
          <div
            aria-label={translate('Description.VideoPreviewUnavailable')}
            className='flex height-900 width-1600 items-center justify-center radius-small bg-shift-200 content-muted'
            data-testid='game-preview-video-banner-unavailable'
            role='img'>
            <Icon name='icon-regular-video-camera-slash' size='Medium' />
          </div>
        ) : (
          <RobloxVideoPlayer
            className={styles.video}
            disableControls
            environment={GetVideoPlayerEnvEnum()}
            muted
            onLoadError={(error) => {
              CaptureException(error, {
                context: 'Failed to load sponsored universe game preview video banner',
                videoAssetId,
              });
              setFailedVideoAssetId(videoAssetId);
            }}
            videoAssetId={String(videoAssetId)}
          />
        )}
      </div>
      <div className='flex min-width-0 fill flex-col'>
        <p className='margin-[0px] text-title-medium content-emphasis'>
          {translate('Label.GameplayVideo')}
        </p>
        <p className='margin-[0px] text-body-small content-default'>
          {translate(
            hasLoadError
              ? 'Description.VideoPreviewUnavailable'
              : 'Description.GameplayVideoCampaignBanner',
          )}
        </p>
      </div>
      {!hasLoadError ? (
        <Button
          className='shrink-0'
          onClick={() => openGamePreviewVideoDialog(String(videoAssetId))}
          size='Medium'
          variant='Standard'>
          {translate('Label.Preview')}
        </Button>
      ) : null}
    </div>
  );
};

export default CampaignGamePreviewVideoBanner;
