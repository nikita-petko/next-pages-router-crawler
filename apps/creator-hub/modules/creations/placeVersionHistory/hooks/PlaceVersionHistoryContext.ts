import { createContext } from 'react';
import type { RobloxApiDevelopAssetVersion } from '@rbx/client-develop/v1';

export const DEFAULT_PAGE_SIZE = 10;
export interface PlaceVersionHistoryContext {
  isLoadingCurrentVersionHistory: boolean;
  isRestoring: boolean;
  currentVersionHistory?: RobloxApiDevelopAssetVersion[];
  pageCount: number;
  page: number;
  pageSize: number;
  count: number;
  isPublishedVersionsOnly: boolean;
  restoreCurrentVersionHistory: (assetVersionNumber: number) => Promise<void>;
  refreshCurrentVersionHistory: () => Promise<void>;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (pageSize: number) => void;
  setPublishedVersionsOnly: (status: boolean) => void;
}

const placeVersionHistoryContext = createContext<PlaceVersionHistoryContext>({
  isLoadingCurrentVersionHistory: false,
  isRestoring: false,
  pageCount: 0,
  page: 0,
  count: 0,
  isPublishedVersionsOnly: false,
  pageSize: DEFAULT_PAGE_SIZE,
  restoreCurrentVersionHistory: () => {
    throw new Error('Not implemented');
  },
  refreshCurrentVersionHistory: () => {
    throw new Error('Not implemented');
  },
  nextPage: () => {
    throw new Error('Not implemented');
  },
  previousPage: () => {
    throw new Error('Not implemented');
  },
  setPageSize: () => {
    throw new Error('Not implemented');
  },
  setPublishedVersionsOnly: () => {
    throw new Error('Not implemented');
  },
});
placeVersionHistoryContext.displayName = 'placeVersionHistory';

export default placeVersionHistoryContext;
