import {
  IPContent,
  IPContentStatusReasonEnum,
  IPContentContentTypeEnum,
} from '@rbx/clients/rightsV1';

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
        default:
          return '';
      }
    default:
      return '';
  }
};

export default getIpContentStatusReason;
