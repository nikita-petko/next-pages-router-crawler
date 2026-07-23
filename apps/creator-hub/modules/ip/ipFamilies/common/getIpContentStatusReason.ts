import type { IPContent } from '@rbx/client-rights/v1';
import { IPContentStatusReasonEnum, IPContentContentTypeEnum } from '@rbx/client-rights/v1';
import { SupportedRobloxAssetTypeEnum } from '../constants';

// getIpContentStatusReason returns the translatedreason for the IP content status. Assumes translate has access
// to the Rights Portal translation keys.
const getIpContentStatusReason = (
  reason: IPContentStatusReasonEnum,
  ipContent: IPContent,
  translate: (key: string) => string,
): string => {
  switch (reason) {
    case IPContentStatusReasonEnum.TheContentIsNotRelatedToTheIp:
      switch (ipContent?.contentType) {
        case IPContentContentTypeEnum.Text:
          return translate('Message.IpContentKeywordRejected');
        case IPContentContentTypeEnum.Image:
          return translate('Message.IpContentImageRejected');
        case IPContentContentTypeEnum.Asset:
          if (ipContent.robloxAssetType === SupportedRobloxAssetTypeEnum.Image) {
            return translate('Message.IpContentImageRejected');
          }
          return translate('Message.IpContentAssetRejected');
        case undefined:
        default:
          return '';
      }
    case IPContentStatusReasonEnum.None:
    default:
      return '';
  }
};

export default getIpContentStatusReason;
