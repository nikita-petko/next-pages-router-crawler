import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  CreatorHomeContentApi,
  GroupsApi,
  UserScreenApi,
  YourPlaceReengagementApi,
  LandingEligibilityApi,
  GetYourPlaceReengagementEntryResponse,
} from '@rbx/clients/creatorHomeApi';
import { getBEDEV2ServiceBasePath } from './utils';

const basePath = getBEDEV2ServiceBasePath('creator-home-api');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});
const userScreenApi = new UserScreenApi(configuration);
const groupsApi = new GroupsApi(configuration);
const creatorHomeContentApi = new CreatorHomeContentApi(configuration);
const yourPlaceReengagementApi = new YourPlaceReengagementApi(configuration);
const landingEligibilityApi = new LandingEligibilityApi(configuration);

// eslint-disable-next-line import/prefer-default-export -- Only one export is needed for this module
export const CreatorHomeClient = {
  groupsApi,
  userScreenApi,
  creatorHomeContentApi,
  yourPlaceReengagementApi,
  landingEligibilityApi,
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
