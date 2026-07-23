import { useMemo } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import {
  API_AVAILABILITY_STATUS_LABELS,
  API_JOB_FUNCTION_LABELS,
  API_JOB_TYPE_LABELS,
} from '../constants';
import type { ApiTalentProfile, TalentProfileViewModel } from '../types';
import { getEnumLabel } from '../utils';

/**
 * Maps a raw `TalentProfile` from the backend into a UI-ready view model.
 * The backend stores only `userId`, not the Roblox username string — we pull
 * the username off the authenticated user when the profile belongs to the
 * caller. For recruiter views (profile belongs to someone else), pass the
 * username through the optional second argument.
 */
export function toTalentProfileViewModel(
  profile: ApiTalentProfile,
  robloxUsername: string,
): TalentProfileViewModel {
  const jobFunctions = profile.jobFunctions ?? [];
  return {
    userId: profile.userId,
    robloxUsername,
    displayName: profile.displayName ?? '',
    bio: profile.bio ?? '',
    contactEmail: profile.contactEmail ?? '',
    location: profile.location ?? '',
    website: profile.website ?? '',
    socialLinks: profile.socialLinks ?? [],
    jobFunctions,
    jobFunctionLabels: jobFunctions.map((jf) => getEnumLabel(API_JOB_FUNCTION_LABELS, jf, 'Other')),
    availabilityStatus: profile.availabilityStatus,
    availabilityLabel:
      profile.availabilityStatus !== undefined
        ? getEnumLabel(API_AVAILABILITY_STATUS_LABELS, profile.availabilityStatus, 'Available')
        : '',
    preferredJobType: profile.preferredJobType,
    preferredJobTypeLabel:
      profile.preferredJobType !== undefined
        ? getEnumLabel(API_JOB_TYPE_LABELS, profile.preferredJobType, 'Full time')
        : '',
    yearsOfExperience: profile.yearsOfExperience ?? undefined,
    skillTags: profile.skillTags ?? [],
    workExperiences: profile.workExperiences ?? [],
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

/**
 * View-model hook for the authenticated user's own profile. Pulls
 * `robloxUsername` off `useAuthentication()` (same source as the left-nav
 * user selector) so the UI can show "@username" without refetching.
 */
export function useTalentProfileViewModel(
  profile: ApiTalentProfile | undefined,
): TalentProfileViewModel | undefined {
  const { user } = useAuthentication();
  // `user.name` is the Roblox username (same value the left-nav user selector
  // renders). Not to be confused with `user.displayName`, which is the
  // optional human-readable display name.
  const robloxUsername = user?.name ?? '';
  return useMemo(
    () => (profile ? toTalentProfileViewModel(profile, robloxUsername) : undefined),
    [profile, robloxUsername],
  );
}
