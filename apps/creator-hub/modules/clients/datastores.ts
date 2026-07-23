import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { ListDatastoresResponse, DefaultApi as DatastoresApi } from '@rbx/clients/datastoresApi';

import { getBEDEV2ServiceBasePath } from './utils';

export type {
  ListDatastoresResponse,
  ListDatastoresResponseEntry,
} from '@rbx/clients/datastoresApi';

export class DatastoresClient {
  private datastoresApi: DatastoresApi;

  constructor(basePathDatastores: string = getBEDEV2ServiceBasePath('datastores')) {
    const defaultConfig = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath: basePathDatastores,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

    this.datastoresApi = new DatastoresApi(defaultConfig);
  }

  listDatastores(
    universeId: number,
    limit?: number,
    cursor?: string,
    prefix?: string,
  ): Promise<ListDatastoresResponse> {
    return this.datastoresApi.listDatastores({
      universeId,
      cursor,
      limit,
      prefix,
    });
  }
}

const datastoresClient = new DatastoresClient();
export default datastoresClient;
