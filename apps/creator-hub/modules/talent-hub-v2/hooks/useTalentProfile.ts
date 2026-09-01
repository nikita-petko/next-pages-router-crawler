import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthentication } from '@modules/authentication/providers';
import { hasResponseStatus } from '../api/apiUtils';
import { talentProfileClient } from '../api/talentProfileClient';
import { th2QueryKeys } from '../queryKeys';
import type {
  ApiTalentProfile,
  ApiTalentProfileCreateRequest,
  ApiTalentProfileUpdateRequest,
} from '../types';
import { isMocksEnabled, isNoProfileMockEnabled, TH2_QUERY_OPTIONS } from '../utils';

/**
 * Fetch a talent profile by Roblox user id. Callers pass a numeric Roblox user
 * id (the same one that identifies accounts everywhere else in the product).
 * Used by recruiter views that look up a known applicant's profile.
 */
export function useTalentProfile(userId: number | string | undefined) {
  const mocks = isMocksEnabled();
  let numericUserId: number | undefined;
  if (typeof userId === 'string') {
    numericUserId = Number(userId);
  } else if (typeof userId === 'number') {
    numericUserId = userId;
  } else {
    numericUserId = undefined;
  }
  return useQuery<ApiTalentProfile>({
    queryKey:
      numericUserId !== undefined
        ? th2QueryKeys.talentProfile.profile(String(numericUserId))
        : th2QueryKeys.talentProfile.placeholder,
    queryFn:
      numericUserId !== undefined || mocks
        ? async () => {
            if (mocks) {
              const { MOCK_TALENT_PROFILE_V2 } = await import('../mocks/mockData');
              return MOCK_TALENT_PROFILE_V2;
            }
            if (numericUserId === undefined) {
              throw new Error('Missing required user id');
            }
            return talentProfileClient.getTalentProfile(numericUserId);
          }
        : skipToken,
    ...TH2_QUERY_OPTIONS,
  });
}

/**
 * "My profile" fetches `/api/TalentProfiles/{userId}` using the authenticated
 * user id from `useAuthentication()`. The left-nav user selector uses the
 * same user id, so there's no separate lookup. Returns `null` (not an error)
 * when the user has no profile yet so the "Create profile" empty state can
 * render.
 */
export function useMyTalentProfile() {
  const mocks = isMocksEnabled();
  const noProfileMock = isNoProfileMockEnabled();
  const { user } = useAuthentication();
  const userId = user?.id;
  return useQuery<ApiTalentProfile | null>({
    queryKey: noProfileMock
      ? [...th2QueryKeys.talentProfile.me(), 'no-profile']
      : th2QueryKeys.talentProfile.me(),
    queryFn:
      mocks || userId !== undefined
        ? async () => {
            if (noProfileMock) {
              return null;
            }
            if (mocks) {
              const { MOCK_TALENT_PROFILE_V2 } = await import('../mocks/mockData');
              return MOCK_TALENT_PROFILE_V2;
            }
            try {
              if (userId === undefined) {
                throw new Error('Missing authenticated user id');
              }
              return await talentProfileClient.getTalentProfile(userId);
            } catch (err) {
              if (hasResponseStatus(err) && err.response.status === 404) {
                return null;
              }
              throw err;
            }
          }
        : skipToken,
    ...TH2_QUERY_OPTIONS,
  });
}

export function useCreateTalentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ApiTalentProfileCreateRequest) => {
      if (isMocksEnabled()) {
        const { MOCK_TALENT_PROFILE_V2 } = await import('../mocks/mockData');
        return {
          ...MOCK_TALENT_PROFILE_V2,
          ...payload,
          createdAt: new Date(),
          updatedAt: new Date(),
        } satisfies ApiTalentProfile;
      }
      return talentProfileClient.createTalentProfile(payload);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(th2QueryKeys.talentProfile.me(), data);
      if (data.userId !== undefined) {
        queryClient.setQueryData(th2QueryKeys.talentProfile.profile(String(data.userId)), data);
      }
    },
  });
}

/**
 * The backend ignores any id in the PATCH URL — it mutates the authenticated
 * user's own profile. We still accept the `userId` argument so the per-profile
 * cache entry can be invalidated correctly after the mutation lands.
 */
export function useUpdateTalentProfile(userId: number | string | undefined) {
  const queryClient = useQueryClient();
  let cacheKeyUserId: string | undefined;
  if (typeof userId === 'string') {
    cacheKeyUserId = userId;
  } else if (typeof userId === 'number') {
    cacheKeyUserId = String(userId);
  } else {
    cacheKeyUserId = undefined;
  }

  return useMutation({
    mutationFn: async (payload: ApiTalentProfileUpdateRequest) => {
      if (isMocksEnabled()) {
        const { MOCK_TALENT_PROFILE_V2 } = await import('../mocks/mockData');
        return {
          ...MOCK_TALENT_PROFILE_V2,
          ...payload,
          updatedAt: new Date(),
        } satisfies ApiTalentProfile;
      }
      return talentProfileClient.updateTalentProfile(payload);
    },
    onSuccess: (data) => {
      if (cacheKeyUserId) {
        queryClient.setQueryData(th2QueryKeys.talentProfile.profile(cacheKeyUserId), data);
      }
      queryClient.setQueryData(th2QueryKeys.talentProfile.me(), data);
    },
  });
}
