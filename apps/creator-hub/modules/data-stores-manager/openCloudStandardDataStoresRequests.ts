import type { DataStoreEntry } from '@rbx/client-open-cloud/v2';
import { CloudApi, DataStoreEntryStateEnum } from '@rbx/client-open-cloud/v2';
import { V2CloudProtos } from '@rbx/open-cloud';
import datastoresV2Client from '@modules/clients/dataStoresManager';
import { getResponseFromError } from '@modules/clients/utils';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';
import {
  createTimestampFromDate,
  MAX_PAGE_SIZE,
  parseEntryIdAndScopeFromObjectKey,
} from './common';
import type { DataStoreList, EntryList, DataStore, UniverseStorage } from './types';
import { DataStoreState } from './types';

const ocConfiguration = createClientConfiguration('user', 'bedev2');
const cloudApi = new CloudApi(ocConfiguration);

// Converts a DataStoreEntry to a V2CloudProtos.DataStoreEntry
function toDataStoreEntry(e: DataStoreEntry): V2CloudProtos.DataStoreEntry {
  const state =
    e.state === DataStoreEntryStateEnum.Deleted
      ? V2CloudProtos.DataStoreEntry.State.DELETED
      : V2CloudProtos.DataStoreEntry.State.ACTIVE;

  return V2CloudProtos.DataStoreEntry.create({
    path: e.path,
    createTime: createTimestampFromDate(e.createTime),
    revisionId: e.revisionId,
    revisionCreateTime: createTimestampFromDate(e.revisionCreateTime),
    state,
    etag: e.etag,
    // oxlint-disable-next-line typescript-eslint/no-unsafe-assignment
    value: e.value,
    id: e.id,
    users: e.users,
    attributes: e.attributes,
  });
}

export async function updateEntry(
  universeId: number,
  dataStoreName: string,
  scope: string,
  entryId: string,
  entryValue: unknown,
  currentVersion: string,
): Promise<DataStoreEntry> {
  const dataStoreEntry: DataStoreEntry = {
    // oxlint-disable-next-line typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion
    value: entryValue as DataStoreEntry['value'],
    etag: currentVersion,
  };

  const encodedEntryId = encodeURIComponent(entryId);
  const updateResponse = await cloudApi.cloudUpdateDataStoreEntryUsingUniversesDataStoresScopes({
    universeId: universeId.toString(),
    dataStoreId: dataStoreName,
    scopeId: scope,
    entryId: encodedEntryId,
    dataStoreEntry,
    allowMissing: false,
  });

  return updateResponse;
}

export async function listDataStores(
  universeId: number,
  maxPageSize?: number,
  pageToken?: string,
  filter?: string,
  showDeleted?: boolean,
): Promise<DataStoreList> {
  const parsedFilter = filter ? `id.startsWith("${filter}")` : '';
  const response = await cloudApi.cloudListDataStores({
    universeId: universeId.toString(),
    maxPageSize: maxPageSize ?? MAX_PAGE_SIZE,
    pageToken,
    filter: parsedFilter,
    showDeleted: showDeleted ?? false,
  });

  /* oxlint-disable typescript-eslint/no-unsafe-type-assertion */
  const dataStores = (response.dataStores ?? []).map(
    (ds) =>
      ({
        name: ds.id,
        totalSizeBytes: '--',
        numKeys: '--',
        state: ds.state as DataStoreState,
        expireTime: ds.expireTime,
      }) as DataStore,
  );
  /* oxlint-enable typescript-eslint/no-unsafe-type-assertion */

  return {
    dataStores,
    cursor: response.nextPageToken ?? null,
    storageTracking: false,
  };
}

export async function deleteDataStore(universeId: number, dataStoreName: string): Promise<boolean> {
  try {
    await cloudApi.cloudDeleteDataStore({
      universeId: universeId.toString(),
      dataStoreId: dataStoreName,
    });
    return true;
  } catch {
    return false;
  }
}

export async function undeleteDataStore(
  universeId: number,
  dataStoreName: string,
): Promise<boolean> {
  try {
    await cloudApi.cloudUndeleteDataStore({
      universeId: universeId.toString(),
      dataStoreId: dataStoreName,
      body: {},
    });
    return true;
  } catch {
    return false;
  }
}

export async function listEntries(
  universeId: number,
  name: string,
  scope: string,
  maxPageSize?: number,
  pageToken?: string,
  prefix?: string,
  showDeleted?: boolean,
): Promise<EntryList> {
  const filter = prefix ? `id.startsWith("${prefix}")` : '';
  const requestScope = scope === '' ? 'global' : scope;

  const response = await cloudApi.cloudListDataStoreEntriesUsingUniversesDataStores({
    universeId: universeId.toString(),
    dataStoreId: name,
    scopeId: requestScope,
    maxPageSize: maxPageSize ?? MAX_PAGE_SIZE,
    pageToken,
    filter,
    showDeleted: showDeleted ?? false,
  });

  let entries = response.dataStoreEntries ?? [];

  // Fetch detailed information about each entry (only needed if displaying deleted entries).
  if (showDeleted) {
    entries = await Promise.all(
      entries.map(async (entry) => {
        // If all scopes is specified, parse the entry for scope and entry ID
        // Decode the entry ID first in case it contains encoded forward slashes
        // oxlint-disable-next-line typescript-eslint/no-non-null-assertion
        const parsedEntryId = parseEntryIdAndScopeFromObjectKey(entry.id!);

        // Call the list revisions endpoint for each entry to get its state and creation time
        const revisionResponse =
          await cloudApi.cloudListDataStoreEntryRevisionsUsingUniversesDataStoresScopes({
            universeId: universeId.toString(),
            dataStoreId: name,
            scopeId: parsedEntryId.scope,
            entryId: parsedEntryId.entryId,
            maxPageSize: 1, // We only need the latest revision
          });

        const latestRevision = revisionResponse.dataStoreEntries?.[0];

        return {
          ...entry,
          state: latestRevision?.state ?? entry.state,
          revisionCreateTime: latestRevision?.revisionCreateTime ?? entry.revisionCreateTime,
        };
      }),
    );
  }

  // TODO: Refactor return type to use DataStoreEntry in @rbx/client-open-cloud package instead
  return {
    entries: entries.map((e: DataStoreEntry) => toDataStoreEntry(e)),
    cursor: response.nextPageToken ?? null,
  };
}

export async function listEntryVersions(
  universeId: number,
  dataStoreName: string,
  scope: string,
  entryName: string,
  maxPageSize?: number,
  pageToken?: string,
): Promise<EntryList> {
  try {
    const response = await cloudApi.cloudListDataStoreEntryRevisionsUsingUniversesDataStoresScopes({
      universeId: universeId.toString(),
      dataStoreId: dataStoreName,
      entryId: entryName,
      scopeId: scope,
      maxPageSize: maxPageSize ?? MAX_PAGE_SIZE,
      pageToken,
    });

    // TODO: Refactor return type to use DataStoreEntry in @rbx/client-open-cloud package instead
    const entries = (response.dataStoreEntries ?? []).map((e: DataStoreEntry) =>
      toDataStoreEntry(e),
    );
    return {
      entries,
      cursor: response.nextPageToken ?? null,
    };
  } catch {
    return {
      entries: [],
      cursor: null,
    };
  }
}

export async function getEntry(
  universeId: number,
  dataStoreName: string,
  scope: string,
  entryName: string,
): Promise<V2CloudProtos.IDataStoreEntry> {
  try {
    const requestScope = scope === '' ? 'global' : scope;

    const entry = await cloudApi.cloudGetDataStoreEntryUsingUniversesDataStoresScopes({
      universeId: universeId.toString(),
      dataStoreId: dataStoreName,
      scopeId: requestScope,
      entryId: entryName,
    });

    // TODO: Refactor return type to use DataStoreEntry in @rbx/client-open-cloud package instead
    return toDataStoreEntry(entry);
  } catch (error) {
    const response = getResponseFromError(error);
    if (response?.status === 400) {
      return {
        id: entryName,
        isError: true,
      } as V2CloudProtos.IDataStoreEntry & { isError?: boolean };
    }
    return { id: entryName } as V2CloudProtos.IDataStoreEntry;
  }
}

export async function getEntryVersion(
  universeId: number,
  dataStoreName: string,
  scope: string,
  entryName: string,
  revisionId: string,
): Promise<V2CloudProtos.IDataStoreEntry> {
  try {
    const requestScope = scope === '' ? 'global' : scope;
    const requestEntryId =
      !revisionId || revisionId === '' ? entryName : `${entryName}@${revisionId}`;

    const entry = await cloudApi.cloudGetDataStoreEntryUsingUniversesDataStoresScopes({
      universeId: universeId.toString(),
      dataStoreId: dataStoreName,
      scopeId: requestScope,
      entryId: requestEntryId,
    });

    // TODO: Refactor return type to use DataStoreEntry in @rbx/client-open-cloud package instead
    return toDataStoreEntry(entry);
  } catch (error) {
    const response = getResponseFromError(error);
    if (response?.status === 400) {
      return {
        id: entryName,
        isError: true,
      } as V2CloudProtos.IDataStoreEntry & { isError?: boolean };
    }
    return { id: entryName } as V2CloudProtos.IDataStoreEntry;
  }
}

export async function deleteEntry(
  universeId: number,
  dataStoreName: string,
  scope: string,
  entryId: string,
): Promise<void> {
  const effectiveScope = scope === '' ? 'global' : scope;
  await cloudApi.cloudDeleteDataStoreEntryUsingUniversesDataStoresScopes({
    universeId: universeId.toString(),
    dataStoreId: dataStoreName,
    scopeId: effectiveScope,
    entryId,
  });
}

function getDisplayBytes(bytes: number | undefined) {
  if (bytes && bytes > 0) {
    return bytes;
  }
  return '--';
}

export async function getUniverseStorage(universeId: number): Promise<UniverseStorage> {
  try {
    const clientResponse = await datastoresV2Client.getUniverseStorage(universeId);

    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    const response = {
      bytesTotalPermanent: getDisplayBytes(clientResponse.bytesTotalPermanent),
      storageLimitBytes: getDisplayBytes(clientResponse.storageLimitBytes),
      numDataStores: getDisplayBytes(clientResponse.numDataStores),
      numKeys: getDisplayBytes(clientResponse.numKeys),
    } as UniverseStorage;

    return response;
  } catch {
    return {
      bytesTotalPermanent: '--',
      storageLimitBytes: '--',
      numDataStores: '--',
      numKeys: '--',
    } as UniverseStorage;
  }
}

export async function getDataStoreStorage(
  universeId: number,
  useStorage: boolean,
  maxPageSize?: number,
  pageToken?: string,
  filter?: string,
  showDeleted?: boolean,
): Promise<DataStoreList> {
  if (useStorage) {
    try {
      // Compile the Data Stores list from two API calls:
      // Storage call returns DS storage information
      // List call returns DS state and expiry time
      const [storageResponse, listResponse] = await Promise.all([
        datastoresV2Client.getDataStoreStorage(universeId, maxPageSize, pageToken, filter),
        listDataStores(universeId, maxPageSize, pageToken, filter, showDeleted),
      ]);

      if (storageResponse.dataStores.length === 0) {
        return listResponse;
      }

      const storageMap = new Map<
        string | undefined,
        { bytesTotalPermanent: number | undefined; numKeys: number | undefined }
      >();
      storageResponse.dataStores.forEach((dataStore) => {
        storageMap.set(dataStore.name, {
          bytesTotalPermanent: dataStore.bytesTotalPermanent,
          numKeys: dataStore.numKeys,
        });
      });

      /* oxlint-disable typescript-eslint/no-unsafe-type-assertion */
      const dataStoreList = listResponse.dataStores.map(
        (dataStore) =>
          ({
            name: dataStore.name,
            totalSizeBytes: getDisplayBytes(storageMap.get(dataStore.name)?.bytesTotalPermanent),
            numKeys: getDisplayBytes(storageMap.get(dataStore.name)?.numKeys),
            state: dataStore.state,
            expireTime: dataStore.expireTime,
          }) as DataStore,
      );
      /* oxlint-enable typescript-eslint/no-unsafe-type-assertion */

      // Add any data stores that exist in list response but not in storage response
      listResponse.dataStores.forEach((dataStore) => {
        const existsInStorage = dataStoreList.some((ds) => ds.name === dataStore.name);
        if (!existsInStorage && (showDeleted || dataStore.state !== DataStoreState.DELETED)) {
          dataStoreList.push({
            name: dataStore.name,
            totalSizeBytes: '--',
            numKeys: '--',
            state: dataStore.state,
            expireTime: dataStore.expireTime,
          } as DataStore);
        }
      });

      return {
        dataStores: dataStoreList,
        cursor: listResponse.cursor ?? null,
        storageTracking: true,
      };
    } catch (error) {
      // if we return a 412 or 500, we need to use the regular listDataStores function.
      // 412 means that we have over 100 DataStores.
      // If we get a 500, it could be from timeouts, so we should try to load the page without storage metrics.
      const response = getResponseFromError(error);
      if (response?.status !== 200) {
        const newResponse = await listDataStores(
          universeId,
          maxPageSize,
          pageToken,
          filter,
          showDeleted,
        );
        return newResponse;
      }

      return {
        dataStores: [],
        cursor: null,
        storageTracking: false,
      };
    }
  } else {
    const newResponse = await listDataStores(
      universeId,
      maxPageSize,
      pageToken,
      filter,
      showDeleted,
    );
    return newResponse;
  }
}
