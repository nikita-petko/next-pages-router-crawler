/**
 * Pass-through to the generated `TalentProfilesApi` so callers don't have to
 * know the generated method names / request envelope shape.
 *
 * Backend surface (talent-hub-v2 TalentProfilesController.cs):
 *   GET    /api/TalentProfiles/{userId:long}   -- caller passes their own user id
 *   POST   /api/TalentProfiles                 -- auth-derived, body only
 *   PATCH  /api/TalentProfiles                 -- auth-derived, body only
 *   DELETE /api/TalentProfiles                 -- auth-derived
 * There is no PUT and no `/me` alias. The "get my profile" flow resolves the
 * authenticated user id client-side (via `useAuthentication`) and fetches
 * `/api/TalentProfiles/{userId}`.
 */
import type {
  ApiTalentProfile,
  ApiTalentProfileCreateRequest,
  ApiTalentProfileUpdateRequest,
} from '../types';
import { talentProfilesApi } from './talentHubClient';

export const talentProfileClient = {
  getTalentProfile: async (userId: string | number): Promise<ApiTalentProfile> => {
    const numericUserId = typeof userId === 'number' ? userId : Number(userId);
    return talentProfilesApi.apiTalentProfilesUserIdGet({ userId: numericUserId });
  },

  createTalentProfile: async (payload: ApiTalentProfileCreateRequest): Promise<ApiTalentProfile> =>
    talentProfilesApi.apiTalentProfilesPost({ createTalentProfileRequest: payload }),

  updateTalentProfile: async (payload: ApiTalentProfileUpdateRequest): Promise<ApiTalentProfile> =>
    talentProfilesApi.apiTalentProfilesPatch({ updateTalentProfileRequest: payload }),

  deleteTalentProfile: async (): Promise<void> => talentProfilesApi.apiTalentProfilesDelete(),
};

export default talentProfileClient;
