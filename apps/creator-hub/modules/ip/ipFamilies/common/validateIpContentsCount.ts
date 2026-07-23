import { IPContent, IPContentContentTypeEnum, IPContentStatusEnum } from '@rbx/clients/rightsV1';
import { MAX_IP_CONTENT_IMAGES } from '../constants';

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
    const isApprovedOrPending =
      content.status === IPContentStatusEnum.Approved ||
      content.status === IPContentStatusEnum.Pending;
    const isImage = content.contentType === IPContentContentTypeEnum.Image;
    return isApprovedOrPending && isImage;
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
