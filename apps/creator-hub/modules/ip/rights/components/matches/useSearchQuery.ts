import { useCallback, useMemo } from 'react';
import type { InfiniteData, QueryKey } from '@tanstack/react-query';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type {
  SearchContent,
  SearchResponse,
  ErrorResponse,
  SearchQuery,
} from '@rbx/client-rights/v1';
import { ErrorResponseFromJSON } from '@rbx/client-rights/v1';
import rightsClient from '@modules/clients/rights';
import { getResponseFromError } from '@modules/clients/utils';
import { SearchType } from './SearchEnums';

const fakeAssetMatch: SearchContent = {
  contentId: '59524676',
  contentName: 'Asset Content',
  contentType: 'asset',
  creator: {
    displayName: 'Big Asset',
    id: 'someID2',
    type: 'user',
  },
};
const fakeMatch: SearchContent = {
  contentId: '47377',
  contentName: 'First Content',
  contentType: 'bundle',
  creator: {
    displayName: 'Eugene Brechko',
    id: 'someID',
    type: 'user',
  },
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for testing
function fakeAPI(searchText: string, pageToken: string): SearchResponse {
  if (searchText === 'nohits') {
    return {
      matches: [],
      nextPageToken: undefined,
    };
  }
  // chagne me
  const pagesize = 7;
  const numRows = 15;
  let curToken = 0;
  if (pageToken) {
    curToken = Number(pageToken);
  }
  curToken += 1;
  setTimeout(() => {}, 500);
  const fullMatches = Array.from(Array.from({ length: pagesize }).keys())
    .map((x) => (curToken - 1) * pagesize + x)
    .map((idx) => {
      const match = idx % 2 ? fakeMatch : fakeAssetMatch;
      return { ...match, contentId: String(47377 + idx) };
    });
  return {
    matches: fullMatches,
    nextPageToken: curToken < numRows ? String(curToken) : undefined,
  };
}

const useSearchQuery = (
  searchType: SearchType,
  searchQuery: SearchQuery,
  source: string,
  currentFilter: string,
) => {
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => ['rightsSearch', searchType, searchQuery, currentFilter, source],
    [searchType, searchQuery, currentFilter, source],
  );

  const response = useInfiniteQuery<
    SearchResponse,
    ErrorResponse,
    InfiniteData<SearchResponse>,
    QueryKey,
    string
  >({
    queryKey,
    queryFn: async ({ pageParam }) => {
      // Skip search if the query is invalid
      if (
        (searchType === SearchType.Text &&
          !searchQuery.text &&
          !searchQuery.ipContentIds?.length) ||
        (searchType === SearchType.Image &&
          !searchQuery.imageId &&
          !searchQuery.ipContentIds?.length)
      ) {
        return { matches: [], nextPageToken: undefined };
      }
      try {
        return await rightsClient.search(searchType, searchQuery, pageParam, source, currentFilter);
      } catch (error) {
        const resp = getResponseFromError(error);
        // This throw is typed properly. ErrorResponse is passed as a generic to useInfiniteQuery.
        // oxlint-disable-next-line typescript/only-throw-error
        throw ErrorResponseFromJSON(await resp?.json());
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
    // we never refetch the active search
    staleTime: Infinity,
    // repeated searches always hit the API
    gcTime: 0,
    initialPageParam: '',
  });
  const reset = useCallback(() => {
    queryClient.removeQueries({ queryKey });
  }, [queryClient, queryKey]);
  return { response: response ?? {}, reset };
};

export default useSearchQuery;
