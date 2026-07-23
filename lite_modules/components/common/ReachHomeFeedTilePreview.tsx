import { TwoByOneTile, type TwoByOneTilePreviewProps } from '@rbx/ads-homepage-components';

import Creative from '@components/common/Creative';
import useReachHomeFeedTilePreviewStyles from '@components/common/ReachHomeFeedTilePreview.styles';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const parseAspectRatioString = (ratio: string | undefined): [number, number] | undefined => {
  if (!ratio) {
    return undefined;
  }
  const parts = ratio.split(':').map(Number);
  if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
    return [parts[0], parts[1]];
  }
  return undefined;
};

interface ReachHomeFeedTilePreviewProps {
  /**
   * Age recommendation label displayed in the tile footer. Omitted in the
   * management drawer (no per-row age-rating data on the `Ad`); supplied by
   * the campaign builder via `useAgeRecommendationLabel`.
   */
  ageRating?: string;
  backgroundAssetId?: number;
  className?: string;
  headline?: string;
  logoAspectRatio?: string;
  logoAssetId?: number;
  /** Passed through to `TwoByOneTile` (e.g. `disableCtaInteraction` when nested in a parent button). */
  previewProps?: TwoByOneTilePreviewProps;
  subtitle?: string;
}

/**
 * Shared TwoByOneTile (Variant2) preview for Reach home-feed creatives — used by the
 * campaign builder (`ReachCreativePreview`) and the management drawer
 * (`ReachCreativePreviewDialog`) so the two flows render the same tile and cannot
 * drift in styling, translations, or layout.
 */
const ReachHomeFeedTilePreview = ({
  ageRating,
  backgroundAssetId,
  className,
  headline,
  logoAspectRatio,
  logoAssetId,
  previewProps,
  subtitle,
}: ReachHomeFeedTilePreviewProps) => {
  // `Label.Ad` is generic and lives in Misc; `Action.View` and `Label.Headline`
  // live in the Campaign namespace (the builder's original `ReachCreativePreview`
  // resolved them through `translateCampaign`). Bind each hook to its namespace
  // explicitly so keys resolve from the namespace that defines them.
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: { backgroundCreative, logoCreative, root },
    cx,
  } = useReachHomeFeedTilePreviewStyles();

  return (
    <div className={cx(root, className)}>
      <TwoByOneTile
        ageRating={ageRating}
        backgroundImage={
          backgroundAssetId !== undefined ? (
            <Creative assetId={backgroundAssetId} className={backgroundCreative} />
          ) : null
        }
        badgeText={translateMisc('Label.Ad')}
        buttonText={translateCampaign('Action.View')}
        headline={headline || translateCampaign('Label.Headline')}
        logoAspectRatio={parseAspectRatioString(logoAspectRatio)}
        logoImage={
          logoAssetId !== undefined ? (
            <Creative assetId={logoAssetId} className={logoCreative} />
          ) : null
        }
        previewProps={previewProps}
        subtitle={subtitle ?? ''}
      />
    </div>
  );
};

export default ReachHomeFeedTilePreview;
