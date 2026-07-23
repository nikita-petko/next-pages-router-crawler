import { Ad } from '@type/ad';
import { CreativeUploadStatus, SimplifiedUploadedCreative } from '@type/uploadedCreative';

/**
 * Checks if an ad or platform is off-platform (i.e., not running on Roblox platform)
 * @param adOrPlatform The ad object or platform string to check
 * @returns true if the ad/platform is off-platform, false if it's on Roblox platform
 */
export const IsOffPlatformAd = (adOrPlatform: Ad | string | undefined): boolean => {
  if (!adOrPlatform) {
    return false;
  }
  const platform = typeof adOrPlatform === 'string' ? adOrPlatform : adOrPlatform.platform;
  return platform !== undefined && platform !== 'Roblox';
};

/**
 * Gets the creatives for an ad, matching by platform for off-platform ads
 * @param ad The ad object
 * @param uploadedCreatives Array of uploaded creatives
 * @returns Array of matched creatives
 */
export const GetCreativesForAd = (
  ad: Ad,
  uploadedCreatives?: SimplifiedUploadedCreative[],
): SimplifiedUploadedCreative[] => {
  if (!uploadedCreatives) {
    return [];
  }

  // Filter out failed creatives
  const successfulCreatives = uploadedCreatives.filter(
    (creative) => creative.platform_status !== 'CREATIVE_PLATFORM_STATUS_FAILED',
  );

  // For off-platform ads, match by platform
  if (IsOffPlatformAd(ad) && ad.platform) {
    const platformForMatching = `AD_CHANNEL_TYPE_${ad.platform.toUpperCase()}`;
    return successfulCreatives.filter((creative) =>
      creative.platform_specific_status?.some(
        (status) =>
          status.platform === platformForMatching &&
          status.status === CreativeUploadStatus.UPLOADED,
      ),
    );
  }

  return [];
};
