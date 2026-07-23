import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import {
  GetDataStoreStorageResponse,
  GetUniverseStorageResponse,
  StorageMetricsApi as DataStoresService,
} from '@rbx/clients/dataStores';

export type {
  GetDataStoreStorageResponse,
  GetDataStoreStorageResponseDataStoreStorageInfo,
  GetUniverseStorageResponse,
} from '@rbx/clients/dataStores';

export class DataStoresV2Client {
  private dataStores: DataStoresService;

  constructor(basePathDatastores: string = getBEDEV2ServiceBasePath('data-stores')) {
    const defaultConfig = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath: basePathDatastores,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

    this.dataStores = new DataStoresService(defaultConfig);
  }

  getUniverseStorage(universeId: number): Promise<GetUniverseStorageResponse> {
    return this.dataStores.dataStoresGetUniverseStorage({ universeId });
  }

  getDataStoreStorage(
    universeId: number,
    maxPageSize?: number,
    pageToken?: string,
    filter?: string,
  ): Promise<GetDataStoreStorageResponse> {
    let prefixFilter;
    if (filter) {
      prefixFilter = `id.startsWith("${filter}")`;
    }

    let pageSize = 15;
    if (maxPageSize) {
      pageSize = maxPageSize;
    }

    return this.dataStores.dataStoresGetDataStoreStorage({
      universeId,
      maxPageSize: pageSize,
      pageToken,
      filter: prefixFilter,
    });
  }
}

const datastoresV2Client = new DataStoresV2Client();
export default datastoresV2Client;
