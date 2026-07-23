import { useMemo } from 'react';
import { ClaimContentContentTypeEnum, SearchContentContentTypeEnum } from '@rbx/client-rights/v1';
import type { ParsedContentUrl } from '../../../helpers/parseContentUrl';
import parseContentUrl, { ContentURLType } from '../../../helpers/parseContentUrl';
import parseUrl from '../../../helpers/parseUrl';
import type Match from '../Match';

const useParseCart = (myCreationLink: string | undefined, infringingMatches: Match[]) => {
  const infringingContents = infringingMatches.map((match: Match) => {
    const parsedInfringingContent: ParsedContentUrl = {
      contentId: parseInt(match.searchContent.contentId || '-1', 10),
      contentType:
        match.searchContent.contentType === SearchContentContentTypeEnum.Asset
          ? ClaimContentContentTypeEnum.Asset
          : ClaimContentContentTypeEnum.Bundle,
      originalLink: match.originalLink ?? '',
      error: '',
    };
    return parsedInfringingContent;
  });
  let myParsedContent: ParsedContentUrl = useMemo(() => {
    return {
      contentId: -1,
      contentType: ClaimContentContentTypeEnum.External,
      error: '',
    };
  }, []);

  try {
    if (myCreationLink?.length) {
      const parsedMyContentUrl = parseContentUrl(myCreationLink, ContentURLType.Original);
      if (parsedMyContentUrl.contentId !== -1) {
        myParsedContent = {
          contentId: parsedMyContentUrl.contentId,
          contentType: parsedMyContentUrl.contentType,
          error: '',
        };
      } else if (parseUrl(myCreationLink)) {
        myParsedContent = {
          contentId: -1,
          contentType: ClaimContentContentTypeEnum.External,
          error: '',
        };
      }
    }
  } catch {
    // use default myParsedContent on error
  }

  return useMemo(() => {
    return {
      infringingContents: infringingContents || [],
      myContent: myParsedContent,
    };
  }, [infringingContents, myParsedContent]);
};

export default useParseCart;
