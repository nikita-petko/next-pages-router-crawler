import { Ad } from '@type/ad';
import type { ReachTablePreviewData } from '@type/genericManagementTable';

/** Maps API `logo_asset_aspect_width` to the width of the logo aspect ratio (1 → 1:1, 3 → 3:1). */
export const logoAssetAspectWidthToRatioString = (
  logoAssetAspectWidth: number | undefined,
): string | undefined => {
  if (logoAssetAspectWidth === 3) {
    return '3:1';
  }
  if (logoAssetAspectWidth === 1) {
    return '1:1';
  }
  return undefined;
};

/** Build Reach tile preview data from a date-filtered `Ad` row (native API includes creative copy). */
export const buildReachTablePreviewDataFromAd = (ad: Ad): ReachTablePreviewData | undefined => {
  const meta = ad.sponsored_universe_ad_metadata;
  const backgroundAssetId = meta?.asset_metadata?.asset_id;
  if (backgroundAssetId === undefined) {
    return undefined;
  }
  const headline = meta.headline ?? ad.headline ?? '';
  const subtitle = meta.subtitle ?? ad.subtitle;
  const logoAssetId = meta.logo_asset_id ?? ad.logo_asset_id;
  const logoAspectWidth = meta.logo_asset_aspect_width ?? ad.logo_asset_aspect_width;
  return {
    backgroundAssetId,
    headline,
    logoAspectRatio: logoAssetAspectWidthToRatioString(logoAspectWidth),
    logoAssetId,
    subtitle,
  };
};
