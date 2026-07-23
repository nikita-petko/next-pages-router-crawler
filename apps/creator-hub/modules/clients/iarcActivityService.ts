import type {
  V1UniversesUniverseIdIarcActivitiesGetRequest,
  V1UniversesUniverseIdIarcActivitiesIdGetRequest,
  ListIarcActivitiesResponse,
  GetIarcActivityResponse,
} from '@rbx/client-iarc-activity-service/v1';
import { IarcActivityServiceAPIApi } from '@rbx/client-iarc-activity-service/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type {
  IarcActivity,
  IarcActivityType,
  ListIarcActivitiesResponse,
  GetIarcActivityResponse,
} from '@rbx/client-iarc-activity-service/v1';

const configuration = createClientConfiguration('iarc-activity-service', 'bedev2');

const iarcActivityServiceApi = new IarcActivityServiceAPIApi(configuration);

export interface IarcActivityServiceClient {
  listIarcActivities(
    universeId: number,
    pageSize?: number,
    pageToken?: string,
  ): Promise<ListIarcActivitiesResponse>;
  getIarcActivity(universeId: number, id: string): Promise<GetIarcActivityResponse>;
}

const iarcActivityServiceClient: IarcActivityServiceClient = {
  listIarcActivities(
    universeId: number,
    pageSize?: number,
    pageToken?: string,
  ): Promise<ListIarcActivitiesResponse> {
    const request: V1UniversesUniverseIdIarcActivitiesGetRequest = {
      universeId,
      pageSize,
      pageToken,
    };
    return iarcActivityServiceApi.v1UniversesUniverseIdIarcActivitiesGet(request);
  },
  getIarcActivity(universeId: number, id: string): Promise<GetIarcActivityResponse> {
    const request: V1UniversesUniverseIdIarcActivitiesIdGetRequest = {
      universeId,
      id,
    };
    return iarcActivityServiceApi.v1UniversesUniverseIdIarcActivitiesIdGet(request);
  },
};

export default iarcActivityServiceClient;
