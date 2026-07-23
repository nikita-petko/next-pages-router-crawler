import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { RobloxApiDevelopAssetVersion } from '@rbx/client-develop/v1';
import developClient from '@modules/clients/develop';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import placeVersionHistoryContext from '../hooks/PlaceVersionHistoryContext';
import { setPlaceVersionHistory } from '../utils/PlaceVersionHistoryUtils';

type PagingParameters = {
  currentLimit: number;
  currentCursor?: string;
  prevPageCount: number;
};
const PlaceVersionHistoryProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const { settings, isFetched } = useSettings();
  const enableShowOnlyPublishedPlaceVersions =
    isFetched && settings.enableShowOnlyPublishedPlaceVersions;
  const [currentPage, setCurrentPage] = useState(0);
  const [nextPageCursor, setNextPageCursor] = useState<string>('');
  const [currentVersionHistory, setCurrentVersionHistory] = useState<
    Array<RobloxApiDevelopAssetVersion> | undefined
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
    prevPageCount: 0,
  });
  const [publishedVersionsOnly, setPublishedVersionsOnly] = useState<boolean>(false);

  const { currentLimit } = pagingParameters;

  const { query: routerQuery, isReady: isRouterReady } = useRouter();
  const currentPlaceId = useMemo(() => {
    if (isRouterReady) {
      const { placeId } = routerQuery;
      if (placeId) {
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- preserved pre-existing style
        const parsedId = parseInt(placeId as string, 10);
        return parsedId > 0 ? parsedId : null;
      }
    }
    return null;
  }, [isRouterReady, routerQuery]);

  const previousPageCursor: string | undefined =
    previousPageCursors[previousPageCursors.length - 1];
  const pageCount = Math.ceil(versionHistoryCount / currentLimit);

  const fetchVersionHistory = useCallback(
    async (limit?: number, cursor?: string, prevPageCount?: number) => {
      if (currentPlaceId) {
        if (enableShowOnlyPublishedPlaceVersions) {
          await setPlaceVersionHistory(
            publishedVersionsOnly,
            currentPlaceId,
            setIsLoadingCurrentVersionHistory,
            setNextPageCursor,
            setCurrentVersionHistory,
            setVersionHistoryCount,
            limit,
            cursor,
            prevPageCount,
          );
        } else {
          await setPlaceVersionHistory(
            publishedVersionsOnly,
            currentPlaceId,
            setIsLoadingCurrentVersionHistory,
            setNextPageCursor,
            setCurrentVersionHistory,
            setVersionHistoryCount,
            limit,
            cursor,
            prevPageCount,
          );
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
        prevPageCount: Math.min(previousPageParameters.prevPageCount + 1, pageCount - 1),
      };
    });
    setCurrentPage((prevCurrentPage) => {
      return Math.min(prevCurrentPage + 1, pageCount);
    });
  }, [nextPageCursor, pageCount, pagingParameters.currentCursor]);

  const previousPage = useCallback(() => {
    setPagingParameters((previousPageParameters) => {
      return {
        ...previousPageParameters,
        currentCursor: previousPageCursor,
        prevPageCount: Math.max(previousPageParameters.prevPageCount - 1, 0),
      };
    });
    setCurrentPage((prevCurrentPage) => {
      return Math.max(prevCurrentPage - 1, 0);
    });
    setPreviousPageCursors((prev) => {
      return prev.slice(0, prev.length - 1);
    });
  }, [previousPageCursor]);

  const setCurrentLimit = useCallback((newLimit: number) => {
    setPagingParameters({ currentCursor: undefined, currentLimit: newLimit, prevPageCount: 0 });
    setCurrentPage(0);
  }, []);

  const handleSetPublishedVersionsOnly = useCallback((status: boolean) => {
    setPagingParameters((prev) => ({ ...prev, currentCursor: undefined, prevPageCount: 0 }));
    setCurrentPage(0);
    setPreviousPageCursors([]);
    setPublishedVersionsOnly(status);
  }, []);

  const refreshCurrentVersionHistory = useCallback(() => {
    return fetchVersionHistory(
      pagingParameters.currentLimit,
      pagingParameters.currentCursor,
      pagingParameters.prevPageCount,
    );
  }, [fetchVersionHistory, pagingParameters]);

  useEffect(() => {
    void refreshCurrentVersionHistory();
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
    <placeVersionHistoryContext.Provider value={contextValue}>
      {children}
    </placeVersionHistoryContext.Provider>
  );
};

export default PlaceVersionHistoryProvider;
