import type { IPContent } from '@rbx/client-rights/v1';
import { IPContentStatusEnum } from '@rbx/client-rights/v1';

export default function canArchiveIpContent(ipContent: IPContent) {
  return (
    (ipContent.status === IPContentStatusEnum.Approved ||
      ipContent.status === IPContentStatusEnum.Rejected) &&
    !ipContent.isPrimary
  );
}
