import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  IarcActivityServiceAPIApi,
  V1UniversesUniverseIdIarcActivitiesGetRequest,
  V1UniversesUniverseIdIarcActivitiesIdGetRequest,
  ListIarcActivitiesResponse,
  GetIarcActivityResponse,
} from '@rbx/clients/iarcActivityService/v1';
import { getBEDEV2ServiceBasePath } from './utils';

export type {
  IarcActivity,
  IarcActivityType,
  ListIarcActivitiesResponse,
  GetIarcActivityResponse,
} from '@rbx/clients/iarcActivityService/v1';

const basePath = getBEDEV2ServiceBasePath('iarc-activity-service');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

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
