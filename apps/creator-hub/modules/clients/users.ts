import { Configuration } from '@rbx/clients-core';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  DisplayNamesApi,
  UsersApi,
  UserSearchApi,
  RobloxUsersApiAuthenticatedGetUserResponse,
  RobloxUsersApiUserAgeBracketResponse,
  RobloxWebWebAPIModelsApiPageResponseRobloxUsersApiSearchGetUserResponse,
  V1DisplayNamesValidateGetRequest,
  RobloxUsersApiGetUserResponse,
  V1UsersSearchGetLimitEnum,
  RobloxWebWebAPIModelsApiArrayResponseRobloxUsersApiMultiGetUserResponse,
} from '@rbx/client-users/v1';
import { getBEDEV1ServiceBasePath } from './utils';

export type User = RobloxUsersApiAuthenticatedGetUserResponse;
export type UserSearchResponse =
  RobloxWebWebAPIModelsApiPageResponseRobloxUsersApiSearchGetUserResponse;
export type UserSearchResponseData = RobloxUsersApiGetUserResponse;
export type GetUserByIdResponse = RobloxUsersApiGetUserResponse;
export type AgeBracketResponse = RobloxUsersApiUserAgeBracketResponse;

export class UsersClassClient {
  private displayNameApi: DisplayNamesApi;

  private usersApi: UsersApi;

  private userSearchApi: UserSearchApi;

  constructor(basePath: string = getBEDEV1ServiceBasePath('users')) {
    const configuration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });
    this.displayNameApi = new DisplayNamesApi(configuration);
    this.usersApi = new UsersApi(configuration);
    this.userSearchApi = new UserSearchApi(configuration);
  }

  getAgeBracket(): Promise<RobloxUsersApiUserAgeBracketResponse> {
    return this.usersApi.v1UsersAuthenticatedAgeBracketGet();
  }

  getAuthenticatedUser(): Promise<User> {
    return this.usersApi.v1UsersAuthenticatedGet();
  }

  async validateDisplayName(request: V1DisplayNamesValidateGetRequest): Promise<void> {
    await this.displayNameApi.v1DisplayNamesValidateGet(request);
  }

  searchUsers(
    keyword: string,
    limit?: V1UsersSearchGetLimitEnum,
    cursor?: string,
  ): Promise<UserSearchResponse> {
    const usersSearchRequest = {
      keyword,
      limit,
      cursor,
    };
    return this.userSearchApi.v1UsersSearchGet(usersSearchRequest);
  }

  getUserById(userId: number): Promise<GetUserByIdResponse> {
    const request = {
      userId,
    };
    return this.usersApi.v1UsersUserIdGet(request);
  }

  getUsersByIds(
    userIds: number[],
  ): Promise<RobloxWebWebAPIModelsApiArrayResponseRobloxUsersApiMultiGetUserResponse> {
    const request = {
      request: {
        userIds,
      },
    };
    return this.usersApi.v1UsersPost(request);
  }
}
const usersClient = new UsersClassClient();

const basePath = getBEDEV1ServiceBasePath('users');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});
const usersApi = new UsersApi(configuration);

export const UsersClient = { usersApi };

export default usersClient;
