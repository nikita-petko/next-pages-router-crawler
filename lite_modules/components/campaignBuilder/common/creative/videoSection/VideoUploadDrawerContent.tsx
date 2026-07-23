import { SheetBody, SheetTitle } from '@rbx/foundation-ui';
import { Typography } from '@rbx/ui';

import useCreativesStyles from '@components/campaignBuilder/common/creative/Creatives.styles';
import VideoUploadDragAndDropZone from '@components/campaignBuilder/common/creative/videoSection/VideoUploadDragAndDropZone';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const VideoUploadDrawerContent = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: { creativeUploadDrawerBody },
  } = useCreativesStyles();

  return (
    <>
      <SheetTitle>{translate('Heading.UploadVideoAssets')}</SheetTitle>
      <SheetBody>
        <Typography className={creativeUploadDrawerBody} variant='largeLabel1'>
          {translate('Description.VideoAssetsDescription')}
        </Typography>
        <VideoUploadDragAndDropZone />
      </SheetBody>
    </>
  );
};

export default VideoUploadDrawerContent;
