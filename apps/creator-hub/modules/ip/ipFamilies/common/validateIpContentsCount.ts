import type { IPContent } from '@rbx/client-rights/v1';
import { IPContentContentTypeEnum, IPContentStatusEnum } from '@rbx/client-rights/v1';
import { MAX_IP_CONTENT_IMAGES } from '../constants';
import { SupportedRobloxAssetTypeEnum } from '../constants';

/**
 * Validates limits on IP Contents in a single IP family when new IP Contents are being created. Returns null if valid,
 * or an error message if invalid.
 *
 * translate is expected to be able to process the CreatorDashboard.RightsPortal namespace.
 */
const validateIpContentsCount = (
  existing: IPContent[],
  additional: { images?: number },
  translate: (key: string, args?: { [key: string]: string }) => string,
  locale: string,
): string | null => {
  const relevantImagesCount = existing.filter((content) => {
    const isApprovedOrPendingorBlocked =
      content.status === IPContentStatusEnum.Approved ||
      content.status === IPContentStatusEnum.Pending ||
      content.status === IPContentStatusEnum.Blocked;
    const isImage =
      content.contentType === IPContentContentTypeEnum.Image ||
      (content.contentType === IPContentContentTypeEnum.Asset &&
        content.robloxAssetType === SupportedRobloxAssetTypeEnum.Image);
    return isApprovedOrPendingorBlocked && isImage;
  }).length;
  if (additional.images && relevantImagesCount + additional.images > MAX_IP_CONTENT_IMAGES) {
    const slotsLeft = MAX_IP_CONTENT_IMAGES - relevantImagesCount;
    const slotsLeftLocalized = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(slotsLeft);
    return translate('Error.IpFamilyAddImageLimitHit', { numSlotsLeft: slotsLeftLocalized });
  }
  return null;
};

export default validateIpContentsCount;
