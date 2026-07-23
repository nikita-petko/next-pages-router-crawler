import type {
  RobloxUsersApiAuthenticatedGetUserResponse,
  RobloxUsersApiUserAgeBracketResponse,
  RobloxWebWebAPIModelsApiPageResponseRobloxUsersApiSearchGetUserResponse,
  V1DisplayNamesValidateGetRequest,
  RobloxUsersApiGetUserResponse,
  RobloxUsersApiMultiGetUserResponse,
  V1UsersSearchGetLimitEnum,
  RobloxWebWebAPIModelsApiArrayResponseRobloxUsersApiMultiGetUserResponse,
} from '@rbx/client-users/v1';
import { DisplayNamesApi, UsersApi, UserSearchApi } from '@rbx/client-users/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type User = RobloxUsersApiAuthenticatedGetUserResponse;
export type UserSearchResponse =
  RobloxWebWebAPIModelsApiPageResponseRobloxUsersApiSearchGetUserResponse;
export type UserSearchResponseData = RobloxUsersApiGetUserResponse;
export type GetUserByIdResponse = RobloxUsersApiGetUserResponse;
export type AgeBracketResponse = RobloxUsersApiUserAgeBracketResponse;
export type MultiGetUserResponse = RobloxUsersApiMultiGetUserResponse;

export class UsersClassClient {
  private displayNameApi: DisplayNamesApi;

  private usersApi: UsersApi;

  private userSearchApi: UserSearchApi;

  constructor() {
    const configuration = createClientConfiguration('users', 'bedev1');
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

const usersApi = new UsersApi(createClientConfiguration('users', 'bedev1'));

export const UsersClient = { usersApi };

export default usersClient;
