import { ClaimContentContentTypeEnum } from '@rbx/client-rights/v1';

const contentIdRegex = /\d+/;
export const ContentUrlParseError = 'Link must be a valid Roblox creation URL';
export const ContentUrlDuplicateError = 'Link has already been added';

export enum ContentURLType {
  Infringing,
  Original,
}

export interface ParsedContentUrl {
  contentId: number;
  contentType: ClaimContentContentTypeEnum;
  originalLink?: string;
  error: string;
}

// Extracts the content id and content type from a Roblox URL
const parseContentUrl = (contentUrl: string, type: ContentURLType): ParsedContentUrl => {
  const typeStr = type === ContentURLType.Infringing ? 'infringing' : 'original';
  if (!contentUrl || contentUrl.length === 0) {
    return {
      contentId: -1,
      contentType: ClaimContentContentTypeEnum.Asset,
      originalLink: contentUrl,
      error: `Please provide a link to the ${typeStr} creation`,
    };
  }

  try {
    const parsedUrl = new URL(contentUrl);
    const path = parsedUrl.pathname;
    if (path.includes('http://') || path.includes('https://')) {
      return {
        contentId: -1,
        contentType: ClaimContentContentTypeEnum.Asset,
        originalLink: contentUrl,
        error: ContentUrlParseError,
      };
    }
    if (
      path.startsWith('/game-pass/') ||
      path.startsWith('/badges/') ||
      path.startsWith('/groups/') ||
      path.startsWith('/communities/')
    ) {
      return {
        contentId: -1,
        contentType: ClaimContentContentTypeEnum.Asset,
        originalLink: contentUrl,
        error: ContentUrlParseError,
      };
    }

    const contentIdMatches = path.match(contentIdRegex);
    if (!contentIdMatches || contentIdMatches.length < 1) {
      throw new Error('Could not find content id');
    }
    const contentId = parseInt(contentIdMatches[0], 10);

    if (path.startsWith('/bundles/')) {
      return {
        contentId,
        contentType: ClaimContentContentTypeEnum.Bundle,
        originalLink: contentUrl,
        error: '',
      };
    }
    return {
      contentId,
      contentType: ClaimContentContentTypeEnum.Asset,
      originalLink: contentUrl,
      error: '',
    };
  } catch {
    return {
      contentId: -1,
      contentType: ClaimContentContentTypeEnum.Asset,
      originalLink: contentUrl,
      error: ContentUrlParseError,
    };
  }
};

export default parseContentUrl;
