import { IPContent, IPContentStatusEnum } from '@rbx/clients/rightsV1/v1';

export default function canArchiveIpContent(ipContent: IPContent) {
  return (
    (ipContent.status === IPContentStatusEnum.Approved ||
      ipContent.status === IPContentStatusEnum.Rejected) &&
    !ipContent.isPrimary
  );
}
