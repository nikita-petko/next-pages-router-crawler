import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PagingParameters, PageResponse } from '@rbx/core';
import { CursorPager, PagerError } from '@rbx/core';
import { Pagination } from '@modules/miscellaneous/components';
import ItemGrid from '../components/ItemGrid';
import useNumberOfColumns from '../hooks/useNumberOfColumns';
import type ItemDetails from '../interfaces/ItemDetails';
import type ItemGridStaticConfigProperties from '../interfaces/ItemGridStaticConfigProperties';

interface ItemGridContainerProps<T, P extends PagingParameters> {
  pagingParameters: P;
  itemGridStaticConfigProperties: ItemGridStaticConfigProperties;
  getGridWidth: () => number | undefined;
  loadItems: (pagingParameters: P) => Promise<PageResponse<T>>;
  getItemKey: (item: T) => number | string;
  GridItemComponent: React.FunctionComponent<React.PropsWithChildren<ItemDetails<T>>>;
  errorMessage: string;
  emptyMessage: string;
  retryBtnMessage: string;
}

function ItemGridContainer<T, P extends PagingParameters>({
  pagingParameters,
  getGridWidth, // function which returns the grid width- defaults to the document scrollWidth if returned value is undefined
  loadItems, // function that loads in items (T) based on paging parameters
  getItemKey, // generates the key for React change detection
  GridItemComponent,
  errorMessage, // no items returned but this was due to an error
  emptyMessage, // no items returned from API
  retryBtnMessage, // button text for the 'try again' / 'reload' button on the current page
  itemGridStaticConfigProperties,
}: ItemGridContainerProps<T, P>) {
  const {
    itemGridCSSProperties,
    itemGridCursorPagerProperties: {
      pageSizeInitialValue,
      loadPageSizeInitialValue,
      numberOfRows,
      getNewLoadPageSize,
      getNewPageSize,
      getNumColumns,
    },
  } = itemGridStaticConfigProperties;

  const cursorPager = useMemo(() => {
    return new CursorPager<T, P>(
      pageSizeInitialValue,
      loadPageSizeInitialValue,
      loadItems,
      pagingParameters,
    );
  }, [loadItems, loadPageSizeInitialValue, pageSizeInitialValue, pagingParameters]);

  const [hasError, setHasError] = useState<boolean>(false);
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const didMountRef = useRef(false); // first render did not happen yet

  const numColumns = useNumberOfColumns(itemGridCSSProperties, getNumColumns, getGridWidth);

  const updateData = useCallback(
    async (loadDataPromise: Promise<T[]>) => {
      setIsLoading(true);
      try {
        const response = await loadDataPromise;
        setData(response);
        setHasError(false);
        setIsLoading(false);
      } catch (error) {
        // If paging parameters were changed, do nothing and wait for next request
        if (error !== PagerError.PagingParametersChanged) {
          setData([]);
          setHasError(true);
          setIsLoading(false);
        }
      }
    },
    [setIsLoading, setData],
  );

  useEffect(() => {
    if (didMountRef.current) {
      // Calculate new page size and load page size
      const newPageSize = getNewPageSize(numColumns, numberOfRows);
      const newLoadPageSize = getNewLoadPageSize(newPageSize);

      const newPagingParameters = Object.assign(pagingParameters, {
        pageSize: newPageSize,
        loadPageSize: newLoadPageSize,
      });

      updateData(cursorPager.setPagingParametersAndLoadFirstPage(newPagingParameters));
    }
    didMountRef.current = true;
    // numColumns and numberOfRows are not included in the dependency array since we don't want to trigger a reload of the
    // cursor pager unless the paging parameters change (i.e. the cursor pager should not reset if the window resizes)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO for codeowners
  }, [pagingParameters, updateData]);

  /* Binding functions to pager object */
  const canLoadPreviousPage = () => {
    return cursorPager.canLoadPreviousPage();
  };

  const canLoadNextPage = () => {
    return cursorPager.canLoadNextPage();
  };

  const loadPreviousPage = () => {
    updateData(cursorPager.loadPreviousPage());
  };

  const loadNextPage = () => {
    updateData(cursorPager.loadNextPage());
  };

  const removeItemAtIndex = (index: number) => {
    updateData(cursorPager.removeItemAtIndex(index));
  };

  // in the case of an error, offer user ability to reload current page
  const reloadPage = () => {
    updateData(cursorPager.getCurrentPage());
  };

  return (
    <>
      <ItemGrid
        data={data}
        itemGridCSSProperties={itemGridStaticConfigProperties.itemGridCSSProperties}
        getItemKey={getItemKey}
        GridItemComponent={GridItemComponent}
        removeItemAtIndex={removeItemAtIndex}
        isLoading={isLoading}
        emptyMessage={hasError ? errorMessage : emptyMessage}
        retryBtnMessage={retryBtnMessage}
        reloadCurrentPage={reloadPage}
        hasError={hasError}
      />

      {!hasError && (
        <Pagination
          canLoadPreviousPage={canLoadPreviousPage}
          canLoadNextPage={canLoadNextPage}
          loadPreviousPage={loadPreviousPage}
          loadNextPage={loadNextPage}
          currentPage={cursorPager.getCurrentPageNumber()}
        />
      )}
    </>
  );
}

export default ItemGridContainer;
