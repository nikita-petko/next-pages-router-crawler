import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  RobloxWebWebAPIModelsApiPageResponseRobloxApiDevelopAssetVersion,
  V1AssetsAssetIdSavedVersionsGetLimitEnum,
  RobloxApiDevelopAssetVersion,
} from '@rbx/clients/develop';
import { useRouter } from 'next/router';
import { developClient } from '@modules/clients';
import { useSettings } from '@modules/settings';
import PlaceVersionHistoryContext from '../hooks/PlaceVersionHistoryContext';
import { setPlaceVersionHistory } from '../utils/PlaceVersionHistoryUtils';

type PlaceVersionHistoryResponse = RobloxWebWebAPIModelsApiPageResponseRobloxApiDevelopAssetVersion;
type PagingParameters = {
  currentLimit: number;
  currentCursor?: string;
};
const PlaceVersionHistoryProvider: FunctionComponent<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const { settings, isFetched } = useSettings();
  const enableShowOnlyPublishedPlaceVersions =
    isFetched && settings.enableShowOnlyPublishedPlaceVersions;
  const [currentPage, setCurrentPage] = useState(0);
  const [, setVersionHistoryResponse] = useState<PlaceVersionHistoryResponse | null>(null);
  const [nextPageCursor, setNextPageCursor] = useState<string>('');
  const [currentVersionHistory, setCurrentVersionHistory] = useState<
    Array<RobloxApiDevelopAssetVersion>
  >([]);
  const [isLoadingCurrentVersionHistory, setIsLoadingCurrentVersionHistory] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [versionHistoryCount, setVersionHistoryCount] = useState(0);
  // The /publish-versions endpoint always has previousPageCursors set to undefined.
  // Have to track the cursors ourselves in order for pagination to work.
  const [previousPageCursors, setPreviousPageCursors] = useState<string[]>([]);
  const [pagingParameters, setPagingParameters] = useState<PagingParameters>({
    currentLimit: 10,
    currentCursor: undefined,
  });
  const [publishedVersionsOnly, setPublishedVersionsOnly] = useState<boolean>(false);

  const { currentLimit } = pagingParameters;

  const { query: routerQuery, isReady: isRouterReady } = useRouter();
  const currentPlaceId = useMemo(() => {
    if (isRouterReady) {
      const { placeId } = routerQuery;
      if (placeId) {
        const parsedId = parseInt(placeId as string, 10);
        return parsedId > 0 ? parsedId : null;
      }
    }
    return null;
  }, [isRouterReady, routerQuery]);

  const previousPageCursor: string | undefined =
    previousPageCursors[previousPageCursors.length - 1];
  const pageCount = versionHistoryCount === 0 ? 0 : Math.floor(currentLimit / versionHistoryCount);

  const fetchVersionHistory = useCallback(
    async (limit?: number, cursor?: string) => {
      if (currentPlaceId) {
        if (enableShowOnlyPublishedPlaceVersions) {
          await setPlaceVersionHistory(
            publishedVersionsOnly,
            currentPlaceId,
            setIsLoadingCurrentVersionHistory,
            setNextPageCursor,
            setCurrentVersionHistory,
            setVersionHistoryCount,
            setVersionHistoryResponse,
            limit,
            cursor,
          );
        } else {
          setIsLoadingCurrentVersionHistory(true);
          try {
            const accumulatedVersionHistory: RobloxApiDevelopAssetVersion[] = [];
            let currNextPage = cursor || '';
            do {
              let pageSize = limit || 0;
              if (pageSize > 100) {
                // This pageSize strategy only works if the last two digits in the page sizes are in [00, 10, 25, 50]
                pageSize = pageSize % 100 === 0 ? 100 : pageSize % 100;
              }
              // eslint-disable-next-line no-await-in-loop -- sequential pagination: each request depends on the previous response's cursor
              const response = await developClient.getAssetSavedVersions(
                currentPlaceId,
                undefined,
                pageSize as V1AssetsAssetIdSavedVersionsGetLimitEnum,
                currNextPage,
              );
              currNextPage = response.nextPageCursor ? response.nextPageCursor : '';
              if (response.data) {
                accumulatedVersionHistory.push(...response.data);
              }
            } while (limit && currNextPage !== '' && accumulatedVersionHistory.length < limit);
            setNextPageCursor(currNextPage);
            setCurrentVersionHistory(accumulatedVersionHistory);
            if (cursor === undefined && accumulatedVersionHistory) {
              setVersionHistoryCount(
                Math.max(
                  ...accumulatedVersionHistory.map((version) => version.assetVersionNumber || 0),
                ),
              );
            }
          } catch {
            setVersionHistoryResponse(null);
            setVersionHistoryCount(0);
          } finally {
            setIsLoadingCurrentVersionHistory(false);
          }
        }
      }
    },
    [currentPlaceId, enableShowOnlyPublishedPlaceVersions, publishedVersionsOnly],
  );

  const restoreCurrentVersionHistory = useCallback(
    async (assetVersionNumber: number) => {
      if (currentPlaceId) {
        setIsRestoring(true);
        await developClient.postAssetPublishedVersions(currentPlaceId, assetVersionNumber);
        setIsRestoring(false);
        setCurrentPage(0);
        setPreviousPageCursors([]);
        setPagingParameters((previousPageParameters) => {
          return { ...previousPageParameters, currentCursor: undefined };
        });
      }
    },
    [currentPlaceId],
  );

  const nextPage = useCallback(() => {
    setPreviousPageCursors((prev) => {
      if (pagingParameters.currentCursor) {
        return [...prev, pagingParameters.currentCursor];
      }

      return prev;
    });
    setPagingParameters((previousPageParameters) => {
      return {
        ...previousPageParameters,
        currentCursor: nextPageCursor,
      };
    });
    setCurrentPage((prevCurrentPage) => {
      return Math.max(prevCurrentPage + 1, pageCount);
    });
  }, [nextPageCursor, pageCount, pagingParameters.currentCursor]);

  const previousPage = useCallback(() => {
    setPagingParameters((previousPageParameters) => {
      return { ...previousPageParameters, currentCursor: previousPageCursor };
    });
    setCurrentPage((prevCurrentPage) => {
      return Math.max(prevCurrentPage - 1, 0);
    });
    setPreviousPageCursors((prev) => {
      return [...prev.slice(0, prev.length - 1)];
    });
  }, [previousPageCursor]);

  const setCurrentLimit = useCallback((newLimit: number) => {
    setPagingParameters({ currentCursor: undefined, currentLimit: newLimit });
    setCurrentPage(0);
  }, []);

  const handleSetPublishedVersionsOnly = useCallback((status: boolean) => {
    setPagingParameters((prev) => ({ ...prev, currentCursor: undefined }));
    setCurrentPage(0);
    setPreviousPageCursors([]);
    setPublishedVersionsOnly(status);
  }, []);

  const refreshCurrentVersionHistory = useCallback(() => {
    return fetchVersionHistory(pagingParameters.currentLimit, pagingParameters.currentCursor);
  }, [fetchVersionHistory, pagingParameters]);

  useEffect(() => {
    refreshCurrentVersionHistory();
  }, [refreshCurrentVersionHistory]);

  const contextValue = useMemo(
    () => ({
      isLoadingCurrentVersionHistory,
      isRestoring,
      currentVersionHistory,
      page: currentPage,
      pageCount,
      pageSize: currentLimit,
      count: versionHistoryCount,
      isPublishedVersionsOnly: publishedVersionsOnly,
      setPageSize: setCurrentLimit,
      nextPage,
      previousPage,
      refreshCurrentVersionHistory,
      restoreCurrentVersionHistory,
      setPublishedVersionsOnly: handleSetPublishedVersionsOnly,
    }),
    [
      isLoadingCurrentVersionHistory,
      isRestoring,
      currentVersionHistory,
      currentPage,
      pageCount,
      currentLimit,
      versionHistoryCount,
      publishedVersionsOnly,
      setCurrentLimit,
      nextPage,
      previousPage,
      refreshCurrentVersionHistory,
      restoreCurrentVersionHistory,
      handleSetPublishedVersionsOnly,
    ],
  );

  return (
    <PlaceVersionHistoryContext.Provider value={contextValue}>
      {children}
    </PlaceVersionHistoryContext.Provider>
  );
};

export default PlaceVersionHistoryProvider;
