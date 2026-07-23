import { useState, useCallback, useMemo } from 'react';
import type { SearchUniversesResponse, Surface } from '@rbx/client-universes-api/v1';
import { SearchCreatorType, SearchSortParameter, SortOrder } from '@rbx/client-universes-api/v1';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import type { GenericTablePaginationSpec } from '@modules/charts-generic/tables/GenericTablePagination';
import { OwnerType } from '@modules/clients/analytics';
import universesClient, { type V1SearchUniversesRequest } from '@modules/clients/universes';
import type { TUseOwnerResult } from '../context/useOwner';
import useApiRequest from './useApiRequest';

const OwnerToSearchCreatorType: Record<OwnerType, SearchCreatorType> = {
  [OwnerType.Group]: SearchCreatorType.Group,
  [OwnerType.User]: SearchCreatorType.User,
};

type usePaginatedSearchUniversesSpec = {
  owner: TUseOwnerResult;
  pageSizeOptions: number[]; // set of possible page sizes to choose from
  defaultPageSize: number;
  surface: Surface;
};

type usePaginatedSearchUniversesState = GenericChartState & {
  data: SearchUniversesResponse | null;
  pagination: GenericTablePaginationSpec;
};

const usePaginatedSearchUniverses = ({
  owner,
  pageSizeOptions,
  defaultPageSize,
  surface,
}: usePaginatedSearchUniversesSpec): usePaginatedSearchUniversesState => {
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const updatePageSizeWithPageNumber = useCallback(
    (newPageSize: number) => {
      setPageNumber(Math.floor((pageNumber * pageSize) / newPageSize));
      setPageSize(newPageSize);
    },
    [pageNumber, pageSize],
  );

  const searchRequest: V1SearchUniversesRequest | undefined = useMemo(
    () =>
      owner.isFetched
        ? {
            search: undefined,
            creatorType: OwnerToSearchCreatorType[owner.ownerType],
            creatorTargetId: owner.ownerId,
            isArchived: false,
            isPublic: undefined,
            sortOrder: SortOrder.Desc,
            sortParam: SearchSortParameter.LastUpdated,
            surface,
            pageSize,
            pageIndex: pageNumber,
          }
        : undefined,
    [owner, pageNumber, pageSize, surface],
  );

  const fetchMostRecentExperiences = useCallback(async () => {
    if (!searchRequest) {
      return null;
    }
    return universesClient.searchUniverses(searchRequest);
  }, [searchRequest]);
  const { data, isDataLoading, isResponseFailed, isUserForbidden } = useApiRequest(
    fetchMostRecentExperiences,
  );

  const onNextPage = () => setPageNumber((number) => number + 1);
  const onPreviousPage = () => setPageNumber((number) => number - 1);

  const hasNext = useMemo(() => Boolean(data?.nextResultIndex), [data]);
  const hasPrevious = useMemo(() => pageNumber > 0, [pageNumber]);

  return {
    data,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    pagination: {
      page: pageNumber,
      pageSize,
      total: data?.totalResults ?? 0,
      pageSizeOptions,
      setPageSize: updatePageSizeWithPageNumber,
      onNextPage,
      onPreviousPage,
      hasNext,
      hasPrevious,
    },
  };
};

export default usePaginatedSearchUniverses;
