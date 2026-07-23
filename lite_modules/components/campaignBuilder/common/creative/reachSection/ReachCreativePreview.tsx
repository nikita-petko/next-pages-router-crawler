import { Button } from '@rbx/foundation-ui';
import { Dialog, DialogContent } from '@rbx/ui';
import { useState } from 'react';
import { useWatch } from 'react-hook-form';

import useReachCreativePreviewStyles from '@components/campaignBuilder/common/creative/ReachCreativePreview.styles';
import ReachHomeFeedTilePreview from '@components/common/ReachHomeFeedTilePreview';
import { FormField } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useAgeRecommendationLabel from '@hooks/campaignBuilder/useAgeRecommendationLabel';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { ThumbnailType } from '@type/campaignBuilder';

const ReachCreativePreview = () => {
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const [open, setOpen] = useState<boolean>(false);
  const {
    classes: { previewButtonContainer, previewTileContainer },
  } = useReachCreativePreviewStyles();

  const formThumbnails = useWatch<FormType, typeof FormField.THUMBNAILS>({
    name: FormField.THUMBNAILS,
  });
  const logoAssets = useWatch<FormType, typeof FormField.LOGO_ASSETS>({
    name: FormField.LOGO_ASSETS,
  });
  const headline = useWatch<FormType, typeof FormField.HEADLINE>({
    name: FormField.HEADLINE,
  });
  const subtitle = useWatch<FormType, typeof FormField.SUBTITLE>({
    name: FormField.SUBTITLE,
  });
  const experience = useWatch<FormType, typeof FormField.EXPERIENCE>({
    name: FormField.EXPERIENCE,
  });

  const ageRating = useAgeRecommendationLabel(experience?.universe_id);

  const selectedThumbnails = formThumbnails?.filter(
    (thumbnail: ThumbnailType) => !!thumbnail.isSelected,
  );
  const firstImage = selectedThumbnails?.[0];
  const selectedLogos = logoAssets.filter((logo) => logo.isSelected);
  const firstLogo = selectedLogos[0];

  return (
    <>
      <div className={previewButtonContainer}>
        <Button onClick={() => setOpen(true)} size='Medium' variant='Standard'>
          {translateCampaign('Label.Preview')}
        </Button>
      </div>
      <Dialog maxWidth={false} onClose={() => setOpen(false)} open={open}>
        <DialogContent className={previewTileContainer}>
          <ReachHomeFeedTilePreview
            ageRating={ageRating}
            backgroundAssetId={firstImage?.assetId}
            headline={headline}
            logoAspectRatio={firstLogo?.aspectRatio}
            logoAssetId={firstLogo?.assetId}
            subtitle={subtitle ?? ''}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReachCreativePreview;
