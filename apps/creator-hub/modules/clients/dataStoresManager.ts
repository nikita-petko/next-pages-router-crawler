import type {
  GetDataStoreStorageResponse,
  GetUniverseStorageResponse,
} from '@rbx/client-data-stores/v1';
import { StorageMetricsApi as DataStoresService } from '@rbx/client-data-stores/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type {
  GetDataStoreStorageResponse,
  GetDataStoreStorageResponseDataStoreStorageInfo,
  GetUniverseStorageResponse,
} from '@rbx/client-data-stores/v1';

export class DataStoresV2Client {
  private dataStores: DataStoresService;

  constructor() {
    this.dataStores = new DataStoresService(createClientConfiguration('data-stores', 'bedev2'));
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
