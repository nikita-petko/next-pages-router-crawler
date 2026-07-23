import type { GetYourPlaceReengagementEntryResponse } from '@rbx/client-creator-home-api/v1';
import {
  CreatorHomeContentApi,
  GroupsApi,
  SignalsApi,
  UserScreenApi,
  YourPlaceReengagementApi,
  LandingEligibilityApi,
} from '@rbx/client-creator-home-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

const configuration = createClientConfiguration('creator-home-api', 'bedev2');
const userScreenApi = new UserScreenApi(configuration);
const groupsApi = new GroupsApi(configuration);
const creatorHomeContentApi = new CreatorHomeContentApi(configuration);
const yourPlaceReengagementApi = new YourPlaceReengagementApi(configuration);
const landingEligibilityApi = new LandingEligibilityApi(configuration);
const signalsApi = new SignalsApi(configuration);

export const CreatorHomeClient = {
  groupsApi,
  userScreenApi,
  creatorHomeContentApi,
  yourPlaceReengagementApi,
  landingEligibilityApi,
  signalsApi,
};

export const CreatorHomeReengagementClient = {
  /**
   * Creates a YourPlace reengagement entry for a given universeId.
   * @param universeId number
   */
  createYourPlaceReengagementEntry: (universeId: number): Promise<void> => {
    return yourPlaceReengagementApi.yourPlaceReengagementCreateYourPlaceReengagementEntry({
      yourPlaceReengagementCreateYourPlaceReengagementEntryRequest: { universeId },
    });
  },

  /**
   * Gets the YourPlace reengagement entry for the current user.
   * @returns GetYourPlaceReengagementEntryResponse
   */
  getYourPlaceReengagementEntry: (): Promise<GetYourPlaceReengagementEntryResponse> => {
    return yourPlaceReengagementApi.yourPlaceReengagementGetYourPlaceReengagementEntry();
  },
};
