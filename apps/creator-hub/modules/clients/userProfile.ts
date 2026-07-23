import type {
  UserProfile,
  V1UserProfilesGetProfilesPostRequest,
} from '@rbx/client-user-profile-api/v1';
import { UserProfileApiApi } from '@rbx/client-user-profile-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export const COMBINED_NAME_FIELD_MASK = ['names.combinedName', 'names.username'];

export class UserProfileApiClient {
  public userProfileApi: UserProfileApiApi;

  constructor() {
    this.userProfileApi = new UserProfileApiApi(
      createClientConfiguration('user-profile-api', 'bedev2'),
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
