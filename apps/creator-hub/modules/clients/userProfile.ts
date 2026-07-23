import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  UserProfile,
  UserProfileApiApi,
  V1UserProfilesGetProfilesPostRequest,
} from '@rbx/clients/userProfileApi';
import { getBEDEV2ServiceBasePath } from './utils';

export const COMBINED_NAME_FIELD_MASK = ['names.combinedName', 'names.username'];

export class UserProfileApiClient {
  public userProfileApi: UserProfileApiApi;

  constructor(basePathAuth: string = getBEDEV2ServiceBasePath('user-profile-api')) {
    this.userProfileApi = new UserProfileApiApi(
      new Configuration({
        robloxSiteDomain: process.env.robloxSiteDomain,
        basePath: basePathAuth,
        credentials: 'include',
        unifiedLogger: unifiedLoggerClient,
      }),
    );
  }

  async getUserProfiles(
    userIds?: Array<string> | null,
    fields?: Array<string> | null,
  ): Promise<UserProfile[] | null | undefined> {
    const request: V1UserProfilesGetProfilesPostRequest = {
      getBatchUserProfileRequest: {
        userIds,
        fields,
      },
    };

    return (await this.userProfileApi.v1UserProfilesGetProfilesPost(request)).profileDetails;
  }
}

const userProfileApiClient = new UserProfileApiClient();
export default userProfileApiClient;
