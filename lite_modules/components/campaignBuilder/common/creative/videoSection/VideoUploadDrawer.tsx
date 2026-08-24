import { SheetContent, SheetRoot } from '@rbx/foundation-ui';
import { useFormContext } from 'react-hook-form';

import VideoUploadDrawerContent from '@components/campaignBuilder/common/creative/videoSection/VideoUploadDrawerContent';
import { FormField } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';

interface VideoUploadDrawerProps {
  // Caps the number of videos (defaults to the off-platform raw-video limit).
  maxVideosOverride?: number;
  onClose: () => void;
}

const VideoUploadDrawer = ({ maxVideosOverride, onClose }: VideoUploadDrawerProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);

  const { getValues } = useFormContext<FormType>();

  const setVideoDrawerOpen = useCampaignBuilderStore((state) => state.setVideoDrawerOpen);
  const videoDrawerOpen = useCampaignBuilderStore((state) => state.videoDrawerOpen);
  const isVideoUploadInProgress = useCampaignBuilderStore((state) => state.isVideoUploadInProgress);

  return (
    <SheetRoot
      onOpenChange={(open) => {
        if (!open) {
          // SheetRoot unmounts its children on close, and the drag-and-drop
          // zone keeps in-flight upload state locally. Block close while an
          // upload is running so it can't be silently dropped (which would
          // also leave `isVideoUploadInProgress` stuck true).
          if (isVideoUploadInProgress) {
            return;
          }
          setVideoDrawerOpen(false, getValues(FormField.EXPERIENCE).universe_id);
          onClose();
        }
      }}
      open={videoDrawerOpen}>
      <SheetContent
        closeLabel={translate('Description.CloseVideoDrawer')}
        largeScreenClassName='!max-width-[50vw] width-full'
        largeScreenVariant='side'
        // Block outside clicks so a stray click can't lose drawer state.
        // Esc is only blocked while an upload is in flight (a11y:
        // Esc-to-dismiss is the keyboard-user expectation otherwise).
        onEscapeKeyDown={(e) => {
          if (isVideoUploadInProgress) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}>
        <VideoUploadDrawerContent maxVideosOverride={maxVideosOverride} />
      </SheetContent>
    </SheetRoot>
  );
};

export default VideoUploadDrawer;
