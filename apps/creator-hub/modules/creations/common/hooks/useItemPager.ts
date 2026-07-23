import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CursorPager, PagerError, PageResponse, PagingParameters } from '@rbx/core';

function useItemPager<T, P extends PagingParameters>(
  loadItems: (pagingParameters: P) => Promise<PageResponse<T>>,
  pagingParameters: P,
  onLoad?: (data: T[], isFirstPage: boolean) => void,
  defaultPageSize = 12,
  defaultLoadPageSize = 50,
) {
  const cursorPager = useMemo(
    () => new CursorPager<T, P>(defaultPageSize, defaultLoadPageSize, loadItems, pagingParameters),
    [defaultLoadPageSize, defaultPageSize, loadItems, pagingParameters],
  );

  const [error, setError] = useState<Error | null>(null);
  const [isEmpty, setIsEmpty] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPageItems, setCurrentPageItems] = useState<Array<T> | null>(null);
  const lastfetchPromise = useRef<Promise<Array<T>> | null>(null);

  const withLoadingState = useCallback(
    async (fetchPromise: Promise<Array<T>>) => {
      setIsLoading(true);
      setError(null);
      lastfetchPromise.current = fetchPromise;
      try {
        const response = await fetchPromise;
        if (lastfetchPromise.current !== fetchPromise) {
          return;
        }
        setCurrentPageItems(response);
        const isFirstPage = cursorPager.getCurrentPageNumber() === 1;
        if (isFirstPage) {
          setIsEmpty(response.length === 0);
        }
        if (onLoad) {
          onLoad(response, isFirstPage);
        }
        setIsLoading(false);
      } catch (e) {
        if (lastfetchPromise.current !== fetchPromise) {
          return;
        }
        if (e !== PagerError.PagingParametersChanged) {
          setCurrentPageItems(null);
          if (e instanceof Error) {
            setError(e);
          }
        }
        setIsLoading(false);
      }
      lastfetchPromise.current = null;
    },
    [cursorPager, onLoad],
  );

  const loadPage = useCallback(
    (pageNumber: number) => withLoadingState(cursorPager.loadPage(pageNumber)),
    [cursorPager, withLoadingState],
  );

  const removeItemAtIndex = useCallback(
    async (index: number) => {
      let isLastItemInPage = false;
      const currentPage = await cursorPager.getCurrentPage();
      if (currentPage.length === 1) {
        isLastItemInPage = true;
      }
      if (!isLastItemInPage) {
        await withLoadingState(cursorPager.removeItemAtIndex(index));
      } else {
        cursorPager.removeItemAtIndex(index);
        if (cursorPager.canLoadPreviousPage()) {
          await withLoadingState(cursorPager.loadPreviousPage());
        } else {
          await withLoadingState(cursorPager.loadFirstPage());
        }
      }
    },
    [cursorPager, withLoadingState],
  );

  const reloadCurrentPage = useCallback(() => {
    withLoadingState(cursorPager.reloadCurrentPage());
  }, [cursorPager, withLoadingState]);

  const updateItemAtIndex = useCallback(
    (index: number, itemData: T) => {
      setCurrentPageItems((prev) => {
        if (prev === null) {
          return prev;
        }
        const newData = [...prev];
        newData[index] = itemData;
        return newData;
      });
      withLoadingState(cursorPager.updateItemAtIndex(index, itemData));
    },
    [cursorPager, withLoadingState],
  );

  useEffect(() => {
    withLoadingState(cursorPager.reloadCurrentPage());
  }, [cursorPager, onLoad, withLoadingState]);

  return {
    isLoading,
    isEmpty,
    error,
    currentPageItems,
    removeItemAtIndex,
    reloadCurrentPage,
    updateItemAtIndex,
    paginationProps: {
      onPageChange: loadPage,
      canLoadPreviousPage: () => cursorPager.canLoadPreviousPage(),
      canLoadNextPage: () => cursorPager.canLoadNextPage(),
      loadPreviousPage: () => withLoadingState(cursorPager.loadPreviousPage()),
      loadNextPage: () => withLoadingState(cursorPager.loadNextPage()),
      currentPage: cursorPager.getCurrentPageNumber(),
      pageCount: cursorPager.getPagingParameters().count,
    },
  };
}

export default useItemPager;
