import type {
  CloudListOrderedDataStoreEntriesRequest,
  ListOrderedDataStoreEntriesResponse,
} from '@rbx/client-open-cloud/v2';
import { CloudApi } from '@rbx/client-open-cloud/v2';
import { createClientConfiguration } from './utils/createClientConfiguration';

const cloudApi = new CloudApi(createClientConfiguration('user', 'bedev2'));

export const cloudListOrderedDataStoreEntries = (
  params: CloudListOrderedDataStoreEntriesRequest,
): Promise<ListOrderedDataStoreEntriesResponse> =>
  cloudApi.cloudListOrderedDataStoreEntries(params);
