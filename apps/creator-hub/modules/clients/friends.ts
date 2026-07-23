import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  FriendsApi,
  RobloxFriendsApiModelsResponseUserResponse,
  RobloxFriendsApiMultigetAreFriendsResponse,
  V1UsersUserIdFriendsGetRequest,
  V1UserUserIdMultigetAreFriendsPostRequest,
} from '@rbx/clients/friends';
import { getBEDEV1ServiceBasePath } from './utils';

export class FriendsApiClient {
  public friendsApi: FriendsApi;

  constructor(basePath: string = getBEDEV1ServiceBasePath('friends')) {
    const defaultConfig = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

    this.friendsApi = new FriendsApi(defaultConfig);
  }

  async getUsersFriends(
    userId: number,
  ): Promise<RobloxFriendsApiModelsResponseUserResponse[] | undefined> {
    const request: V1UsersUserIdFriendsGetRequest = {
      userId,
    };

    return (await this.friendsApi.v1UsersUserIdFriendsGet(request)).data;
  }

  async getWhichUsersAreFriendsOfUser(
    userId: number,
    targetUserIds: number[],
  ): Promise<RobloxFriendsApiMultigetAreFriendsResponse | undefined> {
    const request: V1UserUserIdMultigetAreFriendsPostRequest = {
      userId,
      multigetAreFriendsRequestModel: { targetUserIds },
    };

    return this.friendsApi.v1UserUserIdMultigetAreFriendsPost(request);
  }
}

const friendsApiClient = new FriendsApiClient();
export default friendsApiClient;
