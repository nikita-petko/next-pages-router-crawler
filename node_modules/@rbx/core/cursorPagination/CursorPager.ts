import Error from './enums/Error';
import Status from './enums/Status';
import type Pager from './interfaces/Pager';
import type PageResponse from './interfaces/PageResponse';
import type PagingParameters from './interfaces/PagingParameters';
import PaginationCache from './PaginationCache';

class CursorPager<T, P extends PagingParameters> implements Pager<T, P> {
  private cache: PaginationCache<T>;

  private firstPagePagingParameters: P;

  private pagingParameters: P;

  private indexCursors: { [key: number]: string | undefined };

  private initId: number;

  private status: Status;

  private currentPageNumber: number;

  constructor(
    private pageSize: number, // this should be the number of items each page should have (how many items should be returned from a load page promise)
    private loadPageSize: number, // how many results should be loaded at once to fill these pages (how many items should be requested by getItems)
    private getItems: (pagingParameters: P) => Promise<PageResponse<T>>, // promise function(pagingParameters), function that returns promise for getting items, promise should resolve in pageResponse format
    defaultPagingParameters: P,
  ) {
    this.cache = new PaginationCache<T>(pageSize);
    this.firstPagePagingParameters = defaultPagingParameters;
    this.pagingParameters = defaultPagingParameters;
    this.indexCursors = {};

    this.initId = 0;
    this.status = Status.Initialized;
    this.currentPageNumber = 1;

    this.setNextPageCursor('');
  }

  // the current status of what the pager is doing (see: Status)
  getStatus(): Status {
    return this.status;
  }

  // whether or not the pager is currently loading waiting to load something
  isBusy(): boolean {
    return this.status !== Status.Idle;
  }

  // gets the current page number
  getCurrentPageNumber(): number {
    return this.currentPageNumber;
  }

  // gets the paging parameters set by setPagingParametersAndLoadFirstPage
  getPagingParameters(): P {
    return { ...this.firstPagePagingParameters };
  }

  // whether or not the pager has reached the end of the pages of items (will return false if there is no next page to load)
  hasNextPage(): boolean {
    const cacheKey = this.getCacheKey();
    if (this.cache.getLength(cacheKey) > this.currentPageNumber * this.pageSize) {
      // If we have enough in the cache we're good to load the next page
      return true;
    }

    // The cursor for the next page must be defined as a string before we can load the next page with it.
    return typeof this.pagingParameters?.cursor === 'string';
  }

  // whether or not the pager can load the next page of items (will return false if it's busy or there is no next page)
  canLoadNextPage(): boolean {
    return this.hasNextPage() && !this.isBusy();
  }

  // whether or not the pager can load the previous page of items (will be false if it's busy or there is no previous page)
  canLoadPreviousPage(): boolean {
    return !this.isBusy() && this.currentPageNumber > 1;
  }

  // whether or not the pager can load the first page of items (will return false if it's busy)
  canLoadFirstPage(): boolean {
    return !this.isBusy();
  }

  // whether or not the pager can load the first page of items (will return false if it's busy)
  canReloadCurrentPage(): boolean {
    return !this.isBusy();
  }

  // sets new paging parameters then returns loadFirstPage
  setPagingParametersAndLoadFirstPage(newPagingParameters: P): Promise<T[]> {
    this.status = Status.Loading;

    const cacheKey = this.getCacheKey();
    this.cache.clear(cacheKey);

    if (typeof newPagingParameters.pageSize !== 'undefined') {
      this.cache.setPageSize(newPagingParameters.pageSize);
      this.pageSize = newPagingParameters.pageSize;
    }

    if (typeof newPagingParameters.loadPageSize !== 'undefined') {
      this.loadPageSize = newPagingParameters.loadPageSize;
    }

    this.currentPageNumber = 1;
    this.indexCursors = {};
    this.firstPagePagingParameters = { ...newPagingParameters };

    this.pagingParameters = { ...newPagingParameters };

    this.setNextPageCursor('');

    return this.loadPage(1);
  }

  // clears the cache, then loads the page of items for the current page number
  reloadCurrentPage(): Promise<T[]> {
    if (this.currentPageNumber === 1) {
      return this.loadFirstPage();
    }

    const cacheKey = this.getCacheKey();
    let highestIndex = 0;
    const { indexCursors } = this;
    const currentIndex = (this.currentPageNumber - 1) * this.pageSize;

    const indexes = Object.keys(indexCursors);
    indexes.forEach((index) => {
      const numIndex = Number(index);
      if (numIndex > currentIndex) {
        // Delete all cursors higher than the index we're at.
        delete indexCursors[numIndex];
      } else {
        highestIndex = Math.max(numIndex, highestIndex);
      }
    });

    const invalidationIndex = Math.floor(currentIndex / this.loadPageSize) * this.loadPageSize;
    this.cache.removeAfterIndex(cacheKey, invalidationIndex);

    this.setNextPageCursor(indexCursors[highestIndex] || '');

    return this.loadPage(this.currentPageNumber);
  }

  // similar to reloadCurrentPage but does not clear the cache first
  getCurrentPage(): Promise<T[]> {
    return this.loadPage(this.currentPageNumber);
  }

  // loads the next page of items
  loadNextPage(): Promise<T[]> {
    return this.loadPage(this.currentPageNumber + 1);
  }

  // loads the previous page of items
  loadPreviousPage(): Promise<T[]> {
    return this.loadPage(this.currentPageNumber - 1);
  }

  // clears the cache, then loads the first page of items
  loadFirstPage(): Promise<T[]> {
    return this.setPagingParametersAndLoadFirstPage(this.firstPagePagingParameters);
  }

  loadPage(pageNumber: number, id?: number): Promise<T[]> {
    if (typeof id === 'undefined') {
      this.initId += 1;
    }

    const actualId: number = id ?? this.initId;

    return new Promise((originalResolve, originalReject) => {
      const reject = (e: Error) => {
        if (this.initId === actualId) {
          this.status = Status.Idle;
          originalReject(e);
        } else {
          originalReject(Error.PagingParametersChanged);
        }
      };

      const resolve = (data: T[]) => {
        if (this.initId === actualId) {
          this.status = Status.Idle;
          this.currentPageNumber = pageNumber;
          originalResolve(data);
        } else {
          originalReject(Error.PagingParametersChanged);
        }
      };

      if (pageNumber < 1) {
        reject(Error.InvalidPageNumber);
        return;
      }

      const cacheKey = this.getCacheKey();
      const items = this.cache.getPage(cacheKey, pageNumber);

      if (items.length === this.pageSize) {
        resolve(items);
        return;
      }

      if (typeof this.pagingParameters.cursor !== 'string') {
        if (items.length <= 0 && pageNumber > 1) {
          // There's no next page to load and no items in the cache for this page.
          reject(Error.InvalidPageNumber);
          return;
        }

        resolve(items);
        return;
      }

      this.status = Status.Loading;
      this.loadNextPageIntoCache(cacheKey, actualId)
        .then(() => {
          // Call loadPage and we will read from the cache.
          // This will also invoke another call to load more items until either
          // the cache has a sufficient number of items or we run out of next pages.
          this.loadPage(pageNumber, actualId).then(resolve).catch(reject);
        })
        .catch(reject);
    });
  }

  // whether or not the pager can remove an item (will return false if it's busy)
  canRemoveItem(): boolean {
    return !this.isBusy();
  }

  removeItemAtIndex(index: number) {
    const cacheKey = this.getCacheKey();
    this.cache.removeAtIndex(cacheKey, this.currentPageNumber, index);

    if (this.canReloadCurrentPage()) {
      return this.getCurrentPage();
    }

    // Otherwise, load previous page
    return this.loadPage(this.currentPageNumber - 1);
  }

  updateItemAtIndex(index: number, value: T) {
    const cacheKey = this.getCacheKey();
    this.cache.updateAtIndex(cacheKey, this.currentPageNumber, index, value);

    return this.getCurrentPage();
  }

  private getCacheKey(): string {
    return JSON.stringify(this.firstPagePagingParameters);
  }

  private setNextPageCursor(nextPageCursor?: string) {
    this.pagingParameters = { ...this.pagingParameters, cursor: nextPageCursor };
  }

  private loadNextPageIntoCache(cacheKey: string, id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.indexCursors[this.cache.getLength(cacheKey)] = this.pagingParameters.cursor;

      // The page number according to getItems (based on loadPageSize, not pageSize)
      const loadPageNumber = Object.keys(this.indexCursors).length;

      this.getItems({
        ...this.pagingParameters,
        count: this.loadPageSize,
        pageNumber: loadPageNumber,
      })
        .then((result) => {
          if (id === this.initId) {
            this.setNextPageCursor(result.nextPageCursor);
            this.cache.append(cacheKey, result.items);
            resolve();
          } else {
            reject(Error.PagingParametersChanged);
          }
        })
        .catch(() => {
          // Currently swallowing error since we don't know the type really
          if (id === this.initId) {
            reject(Error.GetItemsFailure);
          } else {
            reject(Error.PagingParametersChanged);
          }
        });
    });
  }
}

export default CursorPager;
