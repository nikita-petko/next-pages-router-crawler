import { useMemo } from 'react';
import { ClaimContentContentTypeEnum } from '@rbx/clients/rightsV1';
import parseContentUrl, { ContentURLType } from '../helpers/parseContentUrl';
import parseOriginalContent, { type OriginalContent } from '../helpers/parseOriginalContent';

const DEFAULT_MY_CONTENT: OriginalContent = {
  contentId: -1,
  contentType: ClaimContentContentTypeEnum.External,
  originalLink: '',
};

const useParseLinks = (myCreationLink: string | undefined, infringingLinks: string[]) => {
  const nonEmptyLinks = infringingLinks.filter((link) => link !== '');
  const infringingContents = nonEmptyLinks.map((link: string) =>
    parseContentUrl(link, ContentURLType.Infringing),
  );
  const myContent = useMemo(() => {
    try {
      if (myCreationLink?.length) {
        return parseOriginalContent(myCreationLink) ?? DEFAULT_MY_CONTENT;
      }
    } catch {
      // use default myContent on error
    }
    return DEFAULT_MY_CONTENT;
  }, [myCreationLink]);

  return useMemo(() => {
    return {
      infringingContents: infringingContents || [],
      myContent,
      myContentError: '',
    };
  }, [infringingContents, myContent]);
};

export default useParseLinks;
