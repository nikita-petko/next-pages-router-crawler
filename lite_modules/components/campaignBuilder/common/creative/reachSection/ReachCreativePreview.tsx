import { Button } from '@rbx/foundation-ui';
import { useWatch } from 'react-hook-form';

import useReachCreativePreviewStyles from '@components/campaignBuilder/common/creative/ReachCreativePreview.styles';
import { openReachCreativePreviewDialog } from '@components/common/dialogs/ReachCreativePreviewDialog';
import { FormField, ReachAdFormat } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useAgeRecommendationLabel from '@hooks/campaignBuilder/useAgeRecommendationLabel';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { ThumbnailType } from '@type/campaignBuilder';
import { UploadedVideoType, VideoUploadState } from '@type/fileUpload';

const ReachCreativePreview = () => {
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: { previewButtonContainer },
  } = useReachCreativePreviewStyles();

  const formThumbnails = useWatch<FormType, typeof FormField.THUMBNAILS>({
    name: FormField.THUMBNAILS,
  });
  const logoAssets = useWatch<FormType, typeof FormField.LOGO_ASSETS>({
    name: FormField.LOGO_ASSETS,
  });
  const attributionThumbnails = useWatch<FormType, typeof FormField.ATTRIBUTION_THUMBNAILS>({
    name: FormField.ATTRIBUTION_THUMBNAILS,
  });
  const creativeFormat = useWatch<FormType, typeof FormField.CREATIVE_FORMAT>({
    name: FormField.CREATIVE_FORMAT,
  });
  const ctaButtonType = useWatch<FormType, typeof FormField.CTA_BUTTON_TYPE>({
    name: FormField.CTA_BUTTON_TYPE,
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
  const isBrandClickout = useWatch<FormType, typeof FormField.IS_BRAND_CLICKOUT>({
    name: FormField.IS_BRAND_CLICKOUT,
  });
  const videos = useWatch<FormType, typeof FormField.VIDEOS>({
    name: FormField.VIDEOS,
  });

  const ageRating = useAgeRecommendationLabel(experience?.universe_id);

  const selectedThumbnails = formThumbnails?.filter(
    (thumbnail: ThumbnailType) => !!thumbnail.isSelected,
  );
  const firstImage = selectedThumbnails?.[0];
  const firstLogo = logoAssets.filter((logo) => logo.isSelected)[0];
  const firstAttributionThumbnail = attributionThumbnails?.filter((item) => item.isSelected)[0];
  const isVerticalFormat = creativeFormat === ReachAdFormat.VERTICAL_1X2;
  // Clickout ads ignore the game, so experience name / maturity defaults are
  // only for an experience-targeted 1x2.
  const applyExperienceCopyDefaults = isVerticalFormat && !isBrandClickout;
  // Same predicate useTransformFormToCampaign uses to pick the ad's video asset,
  // so the preview renders the media that actually ships.
  const finishedVideo = videos?.find(
    (video: UploadedVideoType) => video.state === VideoUploadState.FINISHED && !!video.assetId,
  );

  return (
    <div className={previewButtonContainer}>
      <Button
        onClick={() =>
          openReachCreativePreviewDialog({
            ageRating,
            applyExperienceCopyDefaults,
            backgroundAssetId: firstImage?.assetId,
            experienceName: applyExperienceCopyDefaults ? experience?.universe_name : undefined,
            headline,
            logoAspectRatio: firstLogo?.aspectRatio,
            logoAssetId: firstLogo?.assetId,
            subtitle,
            // 1x2-only fields. The dialog switches to the vertical tile on
            // `isVerticalFormat`; the management table never sets these and so
            // always gets the 2x1 preview.
            ...(isVerticalFormat && {
              attributionThumbnailAssetId: firstAttributionThumbnail?.assetId,
              ctaButtonType,
              isVerticalFormat: true,
              videoAssetId: finishedVideo?.assetId,
            }),
          })
        }
        size='Medium'
        variant='Standard'>
        {translateCampaign('Label.Preview')}
      </Button>
    </div>
  );
};

export default ReachCreativePreview;
