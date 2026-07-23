import type {
  RobloxFriendsApiModelsResponseUserResponse,
  RobloxFriendsApiMultigetAreFriendsResponse,
  V1UsersUserIdFriendsGetRequest,
  V1UserUserIdMultigetAreFriendsPostRequest,
} from '@rbx/client-friends/v1';
import { FriendsApi } from '@rbx/client-friends/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export class FriendsApiClient {
  public friendsApi: FriendsApi;

  constructor() {
    this.friendsApi = new FriendsApi(createClientConfiguration('friends', 'bedev1'));
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
