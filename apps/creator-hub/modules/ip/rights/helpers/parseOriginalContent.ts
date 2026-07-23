import { ClaimContentContentTypeEnum } from '@rbx/client-rights/v1';
import parseContentUrl, { ContentURLType } from './parseContentUrl';
import parseUrl from './parseUrl';

export interface OriginalContent {
  contentId: number;
  contentType: ClaimContentContentTypeEnum;
  originalLink: string;
}

const parseOriginalContent = (link: string): OriginalContent | null => {
  if (!link?.trim()) {
    return null;
  }
  const parsed = parseContentUrl(link, ContentURLType.Original);
  if (parsed.contentId !== -1) {
    return {
      contentId: parsed.contentId,
      contentType: parsed.contentType,
      originalLink: link,
    };
  }
  if (parseUrl(link)) {
    return {
      contentId: -1,
      contentType: ClaimContentContentTypeEnum.External,
      originalLink: link,
    };
  }
  return null;
};

export default parseOriginalContent;
