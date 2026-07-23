import { createContext } from 'react';
import type { RobloxApiDevelopAssetVersion } from '@rbx/client-develop/v1';
import type { Asset } from '@modules/miscellaneous/common';

export const DEFAULT_PAGE_SIZE = 10;
export interface VersionHistoryContext {
  isLoadingCurrentVersionHistory: boolean;
  isRestoring: boolean;
  currentVersionHistory?: RobloxApiDevelopAssetVersion[];
  pageCount: number;
  page: number;
  pageSize: number;
  count: number;
  versionDescriptions?: { [key: number]: string | null | undefined };
  // TODO(@nicholasng, COLLAB-4720) remove restoreCurrentVersionHistory and ? for restoreCurrentVersionHistoryAndSetNote when removing enablePackageVersionDescriptions
  restoreCurrentVersionHistory?: (assetVersionNumber: number) => Promise<void>;
  restoreCurrentVersionHistoryAndSetNote?: (
    assetVersionNumber: number,
    assetType: Asset | null | undefined,
    currentVersion: number | undefined,
  ) => Promise<void>;
  refreshCurrentVersionHistory: () => Promise<void>;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (pageSize: number) => void;
}

const versionHistoryContext = createContext<VersionHistoryContext>({
  isLoadingCurrentVersionHistory: false,
  isRestoring: false,
  pageCount: 0,
  page: 0,
  count: 0,
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
});
versionHistoryContext.displayName = 'versionHistory';

export default versionHistoryContext;
