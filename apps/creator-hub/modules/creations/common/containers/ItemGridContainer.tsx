import type { FunctionComponent, ReactNode } from 'react';
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import type { PagingParameters, PageResponse } from '@rbx/core';
import { Pagination } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import ItemGrid from '../components/ItemGrid';
import {
  numberOfRows,
  numberOfColumnsCompact,
  imgSize,
  gridGapThemeValue,
  gridGapThemeValueCompact,
} from '../constants/commonConstants';
import useItemPager from '../hooks/useItemPager';
import useNumberOfColumns from '../hooks/useNumberOfColumns';
import type { ItemDetails } from '../interfaces/ItemDetails';
import useItemGridContainerStyles from './ItemGridContainer.styles';

export interface ItemGridContainerProps<T, P extends PagingParameters> {
  pagingParameters: P;
  loadItems: (pagingParameters: P) => Promise<PageResponse<T>>;
  onNewPageLoaded?: (data: T[]) => Promise<void>;
  updateItems?: (data: T[]) => Array<T>;
  getItemKey: (item: T) => number | string;
  GridItemComponent: FunctionComponent<React.PropsWithChildren<ItemDetails<T>>>;
  errorMessage: string;
  emptyMessage: ReactNode;
  onLoad?: (data: T[]) => void;
  totalItemCount?: number;
  // Will be trigger when total-data.length === 0
  onFirstPageLoad?: (isEmpty: boolean) => void;
  useWideIcons?: boolean;
  maxLoadPageSize?: number;
  toggleEnableItem?: (item: T, enable: boolean) => Promise<boolean>;
}

const emptyItems: never[] = [];

function ItemGridContainer<T, P extends PagingParameters>({
  pagingParameters,
  loadItems,
  onNewPageLoaded,
  updateItems,
  getItemKey,
  GridItemComponent,
  errorMessage,
  emptyMessage,
  onLoad,
  onFirstPageLoad,
  totalItemCount,
  useWideIcons,
  maxLoadPageSize = 100,
  toggleEnableItem,
}: ItemGridContainerProps<T, P>) {
  const {
    classes: { itemGridFailureViewContainer },
  } = useItemGridContainerStyles();
  const [pageItems, setPageItems] = useState<Array<T>>([]);

  const itemsRef = useRef<Array<T>>(undefined);

  useEffect(() => {
    itemsRef.current = pageItems;
  }, [pageItems]);

  const numColumns = useNumberOfColumns(
    imgSize,
    numberOfColumnsCompact,
    gridGapThemeValue,
    gridGapThemeValueCompact,
  );
  const currentPagingParameters = useMemo(() => {
    const newPageSize = Math.min(numColumns * numberOfRows, 100);
    let newLoadPageSize = pagingParameters.loadPageSize ?? (newPageSize < 50 ? 50 : 100);
    newLoadPageSize = Math.min(newLoadPageSize, maxLoadPageSize);
    const totalPageCount = totalItemCount ? Math.ceil(totalItemCount / newPageSize) : undefined;
    return {
      ...pagingParameters,
      pageSize: newPageSize,
      loadPageSize: newLoadPageSize,
      count: totalPageCount,
    };
  }, [maxLoadPageSize, numColumns, pagingParameters, totalItemCount]);

  const fetchItemDetailsAndUpdate = useCallback(
    async (data: T[]) => {
      if (onNewPageLoaded) {
        await onNewPageLoaded(data);
        if (updateItems) {
          setPageItems(updateItems(data));
        }
      }
    },
    [onNewPageLoaded, updateItems],
  );

  const onDataLoad = useCallback(
    (data: T[], isFirstPage: boolean) => {
      if (isFirstPage && onFirstPageLoad) {
        onFirstPageLoad(data.length === 0);
      }
      if (onLoad) {
        onLoad(data);
      }

      void fetchItemDetailsAndUpdate(data);
    },
    [onFirstPageLoad, onLoad, fetchItemDetailsAndUpdate],
  );

  const {
    isEmpty,
    reloadCurrentPage,
    removeItemAtIndex,
    updateItemAtIndex,
    currentPageItems,
    paginationProps,
    error,
    isLoading,
  } = useItemPager<T, P>(loadItems, currentPagingParameters, onDataLoad);

  useEffect(() => {
    if (updateItems) {
      setPageItems(updateItems(currentPageItems ?? emptyItems));
    } else {
      setPageItems(currentPageItems ?? emptyItems);
    }
  }, [currentPageItems, updateItems]);

  const errorPage = useMemo(
    () => (
      <FailureView
        message={errorMessage}
        onReload={reloadCurrentPage}
        className={itemGridFailureViewContainer}
      />
    ),
    [errorMessage, reloadCurrentPage, itemGridFailureViewContainer],
  );

  return (
    <>
      <ItemGrid
        data={pageItems}
        getItemKey={getItemKey}
        GridItemComponent={GridItemComponent}
        removeItemAtIndex={removeItemAtIndex}
        updateItemAtIndex={updateItemAtIndex}
        isLoading={isLoading}
        emptyMessage={error !== null ? errorPage : emptyMessage}
        useWideIcons={useWideIcons}
        toggleEnableItem={async (item: T, enable: boolean) => {
          if (toggleEnableItem && (await toggleEnableItem(item, enable))) {
            reloadCurrentPage();
          }
        }}
      />

      {error === null && !isEmpty && <Pagination {...paginationProps} />}
    </>
  );
}

export default ItemGridContainer;
