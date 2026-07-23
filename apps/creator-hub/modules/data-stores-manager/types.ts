import { V2CloudProtos } from '@rbx/open-cloud';

export type DataStoreList = {
  dataStores: DataStore[];
  cursor: string | null;
  storageTracking: boolean;
};

export type EntryList = {
  entries: V2CloudProtos.IDataStoreEntry[];
  cursor: string | null;
};

export type PageState = {
  tab: string;
  dataStore: string;
  scope: string;
  entry: string;
  revision: string;
  revision1: string;
  dataStoresPrefix: string;
  entryPrefix: string;
};

export type UrlObject = {
  dataStoreName: string;
  scope: string;
  entryName: string;
  revision: string;
  dataStorePagination: Map<number, string>;
  entryPagination: Map<number, string>;
  revisionPagination: Map<number, string>;
};

export type UniverseStorage = {
  bytesTotalPermanent: string;
  storageLimitBytes: string;
  numDataStores: string;
  numKeys: string;
};

export enum DataStoreState {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
}

export type DataStore = {
  name: string;
  totalSizeBytes: string;
  numKeys: string;
  state?: DataStoreState;
  expireTime?: Date;
};
