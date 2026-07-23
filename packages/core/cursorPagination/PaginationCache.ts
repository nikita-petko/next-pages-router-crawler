export default class PaginationCache<T> {
  private cache: { [key: string]: T[] };

  constructor(private pageSize: number) {
    this.cache = {};
  }

  getPage(cacheKey: string, pageNumber: number): T[] {
    const cacheList = this.cache[cacheKey];
    if (cacheList) {
      return cacheList.slice((pageNumber - 1) * this.pageSize, pageNumber * this.pageSize);
    }

    return [];
  }

  getLength(cacheKey: string): number {
    const cacheList = this.cache[cacheKey];
    if (cacheList) {
      return cacheList.length;
    }

    return 0;
  }

  append(cacheKey: string, values: T[]) {
    if (!this.cache[cacheKey]) {
      this.cache[cacheKey] = [];
    }

    this.cache[cacheKey] = this.cache[cacheKey].concat(values);
  }

  removeAfterIndex(cacheKey: string, index: number) {
    if (this.cache[cacheKey]) {
      this.cache[cacheKey] = this.cache[cacheKey].slice(0, index);
    }
  }

  removeAtIndex(cacheKey: string, pageNumber: number, index: number) {
    if (this.cache[cacheKey]) {
      this.cache[cacheKey].splice((pageNumber - 1) * this.pageSize + index, 1);
    }
  }

  updateAtIndex(cacheKey: string, pageNumber: number, index: number, value: T) {
    if (this.cache[cacheKey]) {
      this.cache[cacheKey][(pageNumber - 1) * this.pageSize + index] = value;
    }
  }

  clear(cacheKey: string) {
    delete this.cache[cacheKey];
  }

  setPageSize(pageSize: number) {
    this.pageSize = pageSize;
  }
}
