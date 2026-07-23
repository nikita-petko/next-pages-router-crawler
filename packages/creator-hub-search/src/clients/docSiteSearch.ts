import { useMemo } from 'react';
import {
  SearchApi,
  SearchDocSiteRequest,
  DocSiteResult as DocSiteResultRaw,
  DocSiteSearchResponse as DocSiteSearchResponseRaw,
} from '@rbx/client-creator-resources-search-api/v1';
import { Configuration } from '@rbx/clients-core';
import { DocumentationContentType as DocsSearchDocumentationContentType } from '@rbx/creator-docs-search';
import { useSearchConfig } from '../contexts/SearchConfigContext';
import { getBEDEV2ServiceBasePath } from '../utilities/getBasePaths';
import throwError from '../utilities/error';
import { TTranslateFunction } from '../localization/types/TranslateFunction';
import { TUser } from '../search/types/types';
import { searchClientDocuments, type BuildDatasetConfig } from './clientSearch';
import {
  DocumentationContentType,
  DocumentationCloudApiSubType,
  DocumentationCloudApiType,
  type DocSiteResult,
  parseDocumentationContentType,
  parseDocumentationSubType,
  parseDocumentationThirdType,
} from './docSiteSearchType';
import CategoryTitles from './CategoryTitles';

export type { DocSiteResult };
export { parseDocumentationContentType, parseDocumentationSubType, parseDocumentationThirdType };

/**
 * Creates a SearchApi instance with the given robloxSiteDomain.
 */
function createSearchApi(robloxSiteDomain: string): SearchApi {
  const configuration = new Configuration({
    robloxSiteDomain,
    basePath: getBEDEV2ServiceBasePath('creator-resources-search-api', robloxSiteDomain),
    credentials: 'include',
  });
  return new SearchApi(configuration);
}

export type DocSiteSearchResponse = Omit<DocSiteSearchResponseRaw, 'results'> & {
  isError: boolean;
  results: DocSiteResult[];
};

export interface SearchClient {
  search(request: SearchDocSiteRequest, user?: TUser | null): Promise<DocSiteSearchResponse>;
}

export function getSearchResultUrl(result: DocSiteResultRaw): string | null {
  const { resultTargetReference: reference } = result;
  return reference ?? null;
}

const resolveSearchResults = (response: DocSiteSearchResponseRaw) => {
  if (response.results) {
    return {
      ...response,
      isError: false,
      results: response.results.map((result) => ({
        ...result,
        documentationContentType: parseDocumentationContentType(
          result.documentationContentType ?? '',
        ),
        documentationSubType: parseDocumentationSubType(result.documentationSubType ?? ''),
        documentationThirdType: parseDocumentationThirdType(result.documentationThirdType ?? ''),
        url: getSearchResultUrl(result),
      })),
    };
  }
  return { ...response, isError: false, results: [] };
};

/**
 * Creates a search client with the given SearchApi instance.
 *
 * @param searchApi - The SearchApi instance to use
 * @param config - Optional configuration for client-side search (target/environment)
 */
export function createSearchClient(searchApi: SearchApi, config: BuildDatasetConfig): SearchClient {
  return {
    async search(
      {
        keyword,
        documentationContentType = '',
        documentationSubType = '',
        documentationThirdType = '',
        tag = '',
        isFuzzyMatch = false,
        pageSize = 10,
        pageIndex,
        locale = '',
        searchSessionId,
      }: SearchDocSiteRequest,
      user?: TUser | null,
    ): Promise<DocSiteSearchResponse> {
      const makeRequest = async (
        requestParams: SearchDocSiteRequest,
      ): Promise<DocSiteSearchResponse> => {
        const response = await searchApi.searchSearchDocSite({
          searchSearchDocSiteRequest: requestParams,
        });
        return resolveSearchResults(response);
      };

      const delay = (ms: number): Promise<void> =>
        new Promise((resolve) => {
          setTimeout(resolve, ms);
        });

      const executeWithRetry = async (
        params: SearchDocSiteRequest,
        retryCount: number,
        hasTriedWithoutLocale: boolean,
      ): Promise<DocSiteSearchResponse> => {
        const maxRetries = 3;

        try {
          const results = await makeRequest(params);

          // If results are empty and we have a locale and haven't tried without locale yet
          if (
            (!results.results || results.results.length === 0) &&
            locale &&
            !hasTriedWithoutLocale
          ) {
            // Retry without locale
            const paramsWithoutLocale = {
              ...params,
              locale: '',
            };
            const resultsWithoutLocale = await executeWithRetry(
              paramsWithoutLocale,
              retryCount,
              true,
            );
            if (
              !resultsWithoutLocale ||
              !resultsWithoutLocale.results ||
              resultsWithoutLocale.results.length === 0
            ) {
              return {
                isError: false,
                results: [],
              };
            }

            const resultsWithLocaleResults = resultsWithoutLocale.results.map((result) => {
              const {
                elasticsearchDocumentId,
                url,
                documentationContentType: resultDocumentationContentType,
              } = result;

              if (!elasticsearchDocumentId || !url) {
                return result;
              }

              // Elasticsearch index document id format: https://github.com/Roblox/creator-docs-internal-search/blob/main/src/compile/utils/indexDocumentationUtils.ts#L16
              const elasticsearchDocumentIdSegments = elasticsearchDocumentId.split(':');
              let extractLocale =
                elasticsearchDocumentIdSegments[
                  elasticsearchDocumentIdSegments.length - 1
                ].toLowerCase();
              // Following case doesn't need to add locale prefix:
              // 1. locale is `en-us`
              // 2. url already has locale prefix
              // 3. locale is not valid
              // 4. content type is `Video`, `DevForum`, `CreatorHub`
              if (
                extractLocale === 'en-us' || // locale is `en-us`
                !/^[a-z]{2}-[a-z]{2}$/.test(extractLocale) || // locale is not valid
                (resultDocumentationContentType &&
                  (
                    [
                      DocsSearchDocumentationContentType.Video,
                      DocsSearchDocumentationContentType.DevForum,
                    ] as (DocumentationContentType | null)[]
                  )
                    .concat([DocumentationContentType.CreatorHub])
                    .includes(resultDocumentationContentType)) || // content type is `Video`, `DevForum`, `CreatorHub`
                /^\/[a-z]{2}-[a-z]{2}\/.*$/.test(url) // url already has locale prefix
              ) {
                extractLocale = '';
              }

              return {
                ...result,
                url: extractLocale ? `/${extractLocale}${url}` : url,
              };
            });

            return {
              ...resultsWithoutLocale,
              results: resultsWithLocaleResults,
            };
          }

          return results;
        } catch (error) {
          // Check if it's a 5xx error
          const isServerError =
            typeof error === 'object' &&
            error !== null &&
            'response' in error &&
            typeof (error as { response: { status: number } }).response?.status === 'number' &&
            (error as { response: { status: number } }).response.status >= 500 &&
            (error as { response: { status: number } }).response.status < 600;

          if (isServerError && retryCount < maxRetries) {
            await delay(200 * (retryCount + 1));
            return executeWithRetry(params, retryCount + 1, hasTriedWithoutLocale);
          }

          throwError(`searchClient: failed to fetch search results ${error}`);
          return {
            isError: true,
            results: [],
          };
        }
      };

      // Special handling when documentationContentType is empty or CreatorHub:
      // 1. First call client search (MiniSearch) for CreatorHub dynamic pages
      // 2. Then search for CreatorHub content from backend
      // 3. Search for all other content but filter out CreatorHub
      // 4. Concatenate results with client search first, then backend CreatorHub, then others
      if (
        !documentationContentType ||
        documentationContentType === DocumentationContentType.CreatorHub
      ) {
        const searchDocSiteRequestBase = {
          keyword,
          isFuzzyMatch,
          documentationSubType,
          documentationThirdType,
          tag,
          pageIndex,
          pageSize,
          locale,
          searchSessionId,
        };

        // Execute client search and backend search in parallel
        const [clientResults, otherResults] = await Promise.all([
          // Client-side MiniSearch for CreatorHub pages (no backend request needed)
          user && keyword
            ? searchClientDocuments(keyword, user, config).catch((error) => {
                console.error('Client search failed:', error);
                return [];
              })
            : Promise.resolve([]),
          // Backend search for all non-CreatorHub content (skip if filtering for CreatorHub only)
          documentationContentType === DocumentationContentType.CreatorHub
            ? Promise.resolve({ isError: false, results: [] })
            : executeWithRetry(
                {
                  ...searchDocSiteRequestBase,
                  documentationContentType: '',
                } as SearchDocSiteRequest,
                0,
                false,
              ),
        ]);

        // Filter out any CreatorHub results from backend results
        const filteredOtherResults = {
          ...otherResults,
          results: (otherResults.results || []).filter(
            (result) =>
              result.documentationContentType !== DocsSearchDocumentationContentType.CreatorHub,
          ),
        };

        // Concatenate results: client search CreatorHub first, then other backend results
        return {
          isError: filteredOtherResults.isError,
          results: [...clientResults, ...(filteredOtherResults.results || [])],
        };
      }

      // Normal search flow for specific documentationContentType
      const searchDocSiteRequest = {
        keyword,
        isFuzzyMatch,
        documentationContentType,
        documentationSubType,
        documentationThirdType,
        tag,
        pageIndex,
        pageSize,
        locale,
        searchSessionId,
      } as SearchDocSiteRequest;

      return executeWithRetry(searchDocSiteRequest, 0, false);
    },
  };
}

/**
 * Hook that returns a search client configured with the current environment.
 * Uses SearchConfigContext to get the robloxSiteDomain.
 *
 * @example
 * ```tsx
 * const searchClient = useDocSiteSearchClient();
 * const results = await searchClient.search({ keyword: "test" });
 * ```
 */
export function useDocSiteSearchClient(): SearchClient {
  const { robloxSiteDomain, clients } = useSearchConfig();

  return useMemo(
    () => createSearchClient(createSearchApi(robloxSiteDomain), clients),
    [robloxSiteDomain, clients],
  );
}

export function getCategoryName(result: DocSiteResult): string | null {
  const {
    documentationContentType: contentType,
    documentationSubType: subType,
    documentationThirdType: thirdType,
  } = result;
  if (contentType === null) {
    return null;
  }
  if (contentType === DocumentationContentType.LuaAPI) {
    const engineTitle = CategoryTitles.Engine;
    if (subType === null) {
      return engineTitle;
    }
    if (thirdType === null) {
      return `${engineTitle}: ${subType}`;
    }
    return `${engineTitle}: ${subType}: ${thirdType}`;
  }
  if (contentType === DocumentationContentType.Article) {
    return subType;
  }
  if (contentType === DocumentationContentType.CloudAPI) {
    return CategoryTitles.Cloud;
  }
  if (contentType === DocumentationContentType.Video) {
    return CategoryTitles.Video;
  }
  if (contentType === DocumentationContentType.DevForum) {
    const devForumTitle = CategoryTitles.DevForum;
    if (subType === null) {
      return devForumTitle;
    }
    if (thirdType === null) {
      return `${devForumTitle}: ${subType}`;
    }
    return `${devForumTitle}: ${subType}: ${thirdType}`;
  }
  return null;
}

export function getCategoryTranslationLabels(result: DocSiteResult): string[] {
  const {
    documentationContentType: contentType,
    documentationSubType: subType,
    documentationThirdType: thirdType,
  } = result;
  if (contentType === null) {
    return [];
  }
  if (contentType === DocumentationContentType.CreatorHub) {
    return ['Label.CreatorHub'];
  }
  if (contentType === DocumentationContentType.CloudAPI) {
    const labels = ['Label.Cloud'];
    switch (subType) {
      case DocumentationCloudApiType.Legacy:
        labels.push('Label.CloudAPIVersionLegacy');
        break;
      case DocumentationCloudApiType.V1:
        labels.push('Label.CloudAPIVersionV1');
        break;
      case DocumentationCloudApiType.V2:
        labels.push('Label.CloudAPIVersionV2');
        break;
      case DocumentationCloudApiType.Features:
        labels.push('Label.CloudAPIVersionFeatures');
        break;
      default:
        return labels;
    }
    switch (thirdType) {
      case DocumentationCloudApiSubType.Endpoint:
        labels.push('Label.CloudAPITypeEndpoint');
        break;
      case DocumentationCloudApiSubType.API:
        labels.push('Label.CloudAPITypeAPI');
        break;
      case DocumentationCloudApiSubType.Resource:
        labels.push('Label.CloudAPITypeResource');
        break;
      default:
        return labels;
    }
    return labels;
  }
  return [];
}

export const getTranslatedCategoryDisplayText = (
  result: DocSiteResult,
  translate: TTranslateFunction,
): string | null => {
  const {
    documentationContentType: contentType,
    documentationSubType: subType,
    documentationThirdType: thirdType,
  } = result;
  if (contentType === null) {
    return null;
  }
  if (contentType === DocumentationContentType.LuaAPI) {
    if (subType === null) {
      return translate(`Label.Engine`);
    }
    if (thirdType === null) {
      return translate(`Label.${subType}`);
    }
    return `${translate(`Label.${subType}`)} ${translate(`Label.${thirdType}`)}`;
  }
  if (contentType === DocumentationContentType.Article) {
    return translate(`Label.${subType}`);
  }
  if (contentType === DocumentationContentType.CloudAPI) {
    return getCategoryTranslationLabels(result)
      .map((label) => translate(label))
      .join(' ');
  }
  if (contentType === DocumentationContentType.Video) {
    return translate('Label.Video');
  }
  if (contentType === DocumentationContentType.DevForum) {
    const devForumLabel = translate(`Label.DevForum`);
    if (subType === null) {
      return devForumLabel;
    }
    if (thirdType === null) {
      return `${devForumLabel} ${translate(`Label.${subType}`)}`;
    }
    return `${devForumLabel} ${translate(`Label.${subType}`)} ${translate(`Label.${thirdType}`)}`;
  }
  return `${contentType} ${subType ?? ''} ${thirdType ?? ''}`;
};
