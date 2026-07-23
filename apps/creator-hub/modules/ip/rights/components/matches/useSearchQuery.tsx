import { rightsClient } from '@modules/clients';
import { getResponseFromError } from '@modules/clients/utils';
import {
  SearchContent,
  SearchResponse,
  ErrorResponseFromJSON,
  ErrorResponse,
} from '@rbx/clients/rightsV1';
import { useCallback, useMemo } from 'react';

import { useInfiniteQuery, useQueryClient, InfiniteData, QueryKey } from '@tanstack/react-query';
import { SearchType } from './SearchEnums';

export const searchquerykey = 'rightsClient/searchquery';

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
  const fullMatches = Array.from(Array(pagesize).keys())
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
  searchText: string,
  imageId: string,
  source: string,
  currentFilter: string,
) => {
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => ['rightsSearch', searchType, searchText, imageId, currentFilter, source],
    [searchType, searchText, imageId, currentFilter, source],
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
      try {
        return rightsClient.search(
          searchType,
          searchText,
          imageId,
          pageParam,
          source,
          currentFilter,
        );
      } catch (error) {
        const resp = getResponseFromError(error);
        const body = await resp?.json();
        throw ErrorResponseFromJSON(body);
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
  return { ...response, reset };
};

export default useSearchQuery;
