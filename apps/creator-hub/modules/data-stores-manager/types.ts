import type { V2CloudProtos } from '@rbx/open-cloud';

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

// UI-facing enum for template type selection
export enum RtbfConfigType {
  StandardDataStore = 'StandardDataStore',
  StandardKey = 'StandardKey',
  OrderedKey = 'OrderedKey',
}

// API types matching creator-configs-public-api schema
export type RtbfDataStoreApiType = 'STANDARD' | 'ORDERED';

export type RtbfKeyTemplatePayload = {
  data_store_type: RtbfDataStoreApiType;
  data_store_name: string;
  key_pattern: string;
  scope_pattern?: string;
};

export type RtbfDataStoreTemplatePayload = {
  data_store_type: 'STANDARD';
  data_store_pattern: string;
};

export type RtbfUserDataTemplate =
  | { key_template: RtbfKeyTemplatePayload; data_store_template?: never }
  | { data_store_template: RtbfDataStoreTemplatePayload; key_template?: never };

// Flattened UI representation for displaying a single template row
export type RtbfTemplateRow = {
  id: string;
  configType: RtbfConfigType;
  dataStoreName: string;
  keyPattern: string;
  scopePattern: string;
  dataStorePattern: string;
};

export const MAX_RTBF_TEMPLATES = 100;
export const RTBF_TEMPLATES_PER_PAGE = 10;
export const MAX_RTBF_FIELD_LENGTH = 50;
export const RTBF_REPOSITORY = 'DataStoresConfig' as const;
