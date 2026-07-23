import { ClaimContentContentTypeEnum, SearchContentContentTypeEnum } from '@rbx/clients/rightsV1';
import { useMemo } from 'react';
import parseUrl from '../../../helpers/parseUrl';
import parseContentUrl, {
  ContentURLType,
  ParsedContentUrl,
} from '../../../helpers/parseContentUrl';
import Match from '../Match';

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
