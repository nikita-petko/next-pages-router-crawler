import { SheetBody, SheetTitle } from '@rbx/foundation-ui';

import useCreativesStyles from '@components/campaignBuilder/common/creative/Creatives.styles';
import VideoUploadDragAndDropZone from '@components/campaignBuilder/common/creative/videoSection/VideoUploadDragAndDropZone';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

interface VideoUploadDrawerContentProps {
  maxVideosOverride?: number;
}

const VideoUploadDrawerContent = ({ maxVideosOverride }: VideoUploadDrawerContentProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: { creativeUploadDrawerBody },
  } = useCreativesStyles();

  return (
    <>
      <SheetTitle>{translate('Heading.UploadVideoAssets')}</SheetTitle>
      <SheetBody>
        <span className={`text-body-large ${creativeUploadDrawerBody}`}>
          {translate('Description.VideoAssetsDescription')}
        </span>
        <VideoUploadDragAndDropZone maxVideosOverride={maxVideosOverride} />
      </SheetBody>
    </>
  );
};

export default VideoUploadDrawerContent;
