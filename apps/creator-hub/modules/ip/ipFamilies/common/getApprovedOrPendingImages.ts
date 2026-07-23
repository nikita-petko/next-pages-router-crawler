import type { IPContent } from '@rbx/client-rights/v1';
import { IPContentContentTypeEnum, IPContentStatusEnum } from '@rbx/client-rights/v1';
import { SupportedRobloxAssetTypeEnum } from '../constants';

export default function getApprovedPendingOrBlockedImages(ipContents: IPContent[]) {
  return ipContents.filter((content) => {
    const isApprovedOrPending =
      content.status === IPContentStatusEnum.Approved ||
      content.status === IPContentStatusEnum.Pending ||
      content.status === IPContentStatusEnum.Blocked;
    const isImage =
      content.contentType === IPContentContentTypeEnum.Image ||
      (content.contentType === IPContentContentTypeEnum.Asset &&
        content.robloxAssetType === SupportedRobloxAssetTypeEnum.Image);
    return isApprovedOrPending && isImage;
  });
}
