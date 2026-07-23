import { Icon } from '@rbx/foundation-ui';
import { Skeleton, Typography } from '@rbx/ui';
import { useFormContext } from 'react-hook-form';

import useCreativesStyles from '@components/campaignBuilder/common/creative/Creatives.styles';
import VideoSectionComponent from '@components/campaignBuilder/common/creative/videoSection/VideoSection';
import VideoUploadDrawer from '@components/campaignBuilder/common/creative/videoSection/VideoUploadDrawer';
import useFormLayoutStyles from '@components/campaignBuilder/common/FormLayout.styles';
import { FlowTypes, FormField, ThumbnailSize } from '@constants/campaignBuilder';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import { useVideoResourceManager } from '@hooks/video/useVideoResourceManager';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { UploadedVideoType } from '@type/fileUpload';

interface VideoCreativeSectionProps {
  videos: UploadedVideoType[];
}

const VideoSection = ({ videos }: VideoCreativeSectionProps) => {
  const { getFieldState, getValues, setValue } = useFormContext<FormType>();
  const flowType = useCampaignBuilderStore((state) => state.flowType);
  const editMode = flowType === FlowTypes.EDIT;

  const {
    classes: { fullWidth },
    cx,
  } = useFormLayoutStyles();
  const {
    classes: { creativeUploadButton, creativeUploadButtonWrapper, errorBorder },
  } = useCreativesStyles();

  const { isVideoUploadInProgress, setVideoDrawerOpen, videoDrawerOpen } =
    useCampaignBuilderStore();

  const { offPlatformRequestMaximumRawVideos: maxAllowedVideos } = useAppStore(
    (state) => state.appMetadataState.data,
  );

  useVideoResourceManager(videos, {
    autoCleanupOnUnmount: true,
  });

  const { error: videoError, isTouched: videoIsTouched } = getFieldState(FormField.VIDEOS);

  const hasVideoError = !!videoError && !isVideoUploadInProgress;
  const shouldShowVideoErrorMessage = hasVideoError && !!videoIsTouched;

  const maybeRenderVideoLoadingIndicator = () => {
    if (
      isVideoUploadInProgress &&
      getValues(FormField.VIDEOS).length < maxAllowedVideos &&
      !videoDrawerOpen
    ) {
      return (
        <Skeleton
          animate
          color='inherit'
          data-testid='video-upload-skeleton'
          height={ThumbnailSize.height}
          variant='rectangular'
          width={ThumbnailSize.width}
        />
      );
    }
    return null;
  };

  const maybeRenderVideoReviewOrErrorCopy = () => {
    if (editMode || isVideoUploadInProgress) {
      return null;
    }
    if (shouldShowVideoErrorMessage) {
      return (
        <Typography
          className='[font-size:14px] [margin-top:8px]'
          color='error'
          component='div'
          variant='body1'>
          {videoError?.message}
        </Typography>
      );
    }
    return null;
  };

  const handleVideoDrawerClose = () => {
    setValue(FormField.VIDEOS, getValues(FormField.VIDEOS), {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleVideoUploadClick = () => {
    setVideoDrawerOpen(true, getValues(FormField.EXPERIENCE).universe_id);
  };

  const maybeRenderUploadVideoButton = () => {
    if (editMode) {
      return null;
    }

    return (
      <div className={creativeUploadButtonWrapper}>
        <VideoUploadDrawer onClose={handleVideoDrawerClose} />
        <button
          className={cx(creativeUploadButton, { [errorBorder]: shouldShowVideoErrorMessage })}
          data-testid='video-upload-button'
          onClick={handleVideoUploadClick}
          type='button'>
          <Icon name='icon-regular-circle-plus' size='Medium' />
        </button>
      </div>
    );
  };

  return (
    <div className={fullWidth}>
      <VideoSectionComponent
        maybeRenderUploadVideoButton={maybeRenderUploadVideoButton}
        maybeRenderVideoLoadingIndicator={maybeRenderVideoLoadingIndicator}
        videos={videos || []}
      />
      {maybeRenderVideoReviewOrErrorCopy()}
    </div>
  );
};

export default VideoSection;
