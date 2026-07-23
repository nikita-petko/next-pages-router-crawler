import type { ListDatastoresResponse } from '@rbx/client-datastores-api/v1';
import { DefaultApi as DatastoresApi } from '@rbx/client-datastores-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type {
  ListDatastoresResponse,
  ListDatastoresResponseEntry,
} from '@rbx/client-datastores-api/v1';

export class DatastoresClient {
  private datastoresApi: DatastoresApi;

  constructor() {
    this.datastoresApi = new DatastoresApi(createClientConfiguration('datastores', 'bedev2'));
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
