import { IPContent, IPContentContentTypeEnum, IPContentStatusEnum } from '@rbx/clients/rightsV1';

export default function getApprovedPendingOrBlockedImages(ipContents: IPContent[]) {
  return ipContents.filter((content) => {
    const isApprovedOrPending =
      content.status === IPContentStatusEnum.Approved ||
      content.status === IPContentStatusEnum.Pending ||
      content.status === IPContentStatusEnum.Blocked;
    const isImage = content.contentType === IPContentContentTypeEnum.Image;
    return isApprovedOrPending && isImage;
  });
}
