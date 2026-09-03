import {
  OneByTwoTile,
  type OneByTwoTilePreviewProps,
  type OneByTwoTileView,
} from '@rbx/ads-homepage-components';
import { RobloxVideoPlayer } from '@rbx/video-player';

import Creative from '@components/common/Creative';
import useReachVerticalTilePreviewStyles from '@components/common/ReachVerticalTilePreview.styles';
import { ServerCtaButtonType } from '@constants/ad';
import { ReachCtaButtonLabelKey } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { resolveOneByTwoTilePreviewCopy } from '@utils/reachOneByTwoCopy';
import { GetVideoPlayerEnvEnum } from '@utils/url';

interface ReachVerticalTilePreviewProps {
  /** Age recommendation label. Used as the subtitle when the advertiser left it blank. */
  ageRating?: string;
  /**
   * When true, empty headline/subtitle fall back to the experience name and
   * maturity label. Only experience-targeted (non-clickout) 1x2 ads should set
   * this — clickout ads ignore the game.
   */
  applyExperienceCopyDefaults?: boolean;
  /** The ad's 1:1 attribution thumbnail. Only rendered in the `expanded` view. */
  attributionThumbnailAssetId?: number;
  /** Poster image for the 1x2 video ad (the ad's `thumbnail_asset_id`). */
  backgroundAssetId?: number;
  className?: string;
  /**
   * Advertiser-selected call-to-action button. Resolved through the same
   * `Ads.Serving` keys ads-root uses, so the preview shows the string the ad will
   * actually serve. Undefined is Join — a UI-only choice that maps to leaving
   * the CTA unset on the backend.
   */
  ctaButtonType?: ServerCtaButtonType;
  /** Experience name. Used as the headline when the advertiser left it blank. */
  experienceName?: string;
  headline?: string;
  logoAssetId?: number;
  /** Passed through to `OneByTwoTile` (e.g. `disableCtaInteraction` in read-only previews). */
  previewProps?: OneByTwoTilePreviewProps;
  subtitle?: string;
  /**
   * The uploaded video asset. When set it becomes the tile's media in both views,
   * so the preview matches the ad that actually ships; `backgroundAssetId` is the
   * poster fallback for before a video has finished uploading.
   */
  videoAssetId?: string;
  view?: OneByTwoTileView;
}

/**
 * Shared `OneByTwoTile` preview for 1x2 vertical (video) Reach creatives. Mirrors
 * `ReachHomeFeedTilePreview` for the 2x1 format so both flows resolve assets and
 * translations the same way.
 */
const ReachVerticalTilePreview = ({
  ageRating,
  applyExperienceCopyDefaults,
  attributionThumbnailAssetId,
  backgroundAssetId,
  className,
  ctaButtonType,
  experienceName,
  headline,
  logoAssetId,
  previewProps,
  subtitle,
  videoAssetId,
  view,
}: ReachVerticalTilePreviewProps) => {
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateAdsServing } = useNamespacedTranslation(
    TranslationNamespace.AdsServing,
  );
  const { translate: translateCreativeLibrary } = useNamespacedTranslation(
    TranslationNamespace.CreativeLibrary,
  );
  const {
    classes: { attributionCreative, backgroundCreative, logoCreative, root },
    cx,
  } = useReachVerticalTilePreviewStyles();

  // The 1x2 creative is a video ad, so the uploaded video is the tile's media in
  // both views. The poster image stands in until a video finishes uploading.
  const renderBackgroundMedia = () => {
    if (videoAssetId !== undefined) {
      return (
        <RobloxVideoPlayer
          autoPlay
          className={backgroundCreative}
          disableControls
          environment={GetVideoPlayerEnvEnum()}
          loop
          muted
          playsInline
          videoAssetId={videoAssetId}
        />
      );
    }

    if (backgroundAssetId !== undefined) {
      return <Creative assetId={backgroundAssetId} className={backgroundCreative} />;
    }

    return null;
  };

  const { headline: resolvedHeadline, subtitle: resolvedSubtitle } = resolveOneByTwoTilePreviewCopy(
    {
      ageRating,
      applyExperienceCopyDefaults,
      experienceName,
      headline,
      subtitle,
    },
  );

  return (
    <div className={cx(root, className)}>
      <OneByTwoTile
        attributionThumbnailImage={
          attributionThumbnailAssetId !== undefined ? (
            <Creative assetId={attributionThumbnailAssetId} className={attributionCreative} />
          ) : null
        }
        backgroundImage={renderBackgroundMedia()}
        badgeText={translateMisc('Label.Ad')}
        buttonText={
          ctaButtonType !== undefined
            ? translateAdsServing(ReachCtaButtonLabelKey[ctaButtonType])
            : translateCampaign('Action.Join')
        }
        headline={resolvedHeadline}
        logoImage={
          logoAssetId !== undefined ? (
            <Creative assetId={logoAssetId} className={logoCreative} />
          ) : null
        }
        overflowMenuLabel={translateCreativeLibrary('Label.MoreOptions')}
        previewProps={previewProps}
        subtitle={resolvedSubtitle}
        view={view}
      />
    </div>
  );
};

export default ReachVerticalTilePreview;
