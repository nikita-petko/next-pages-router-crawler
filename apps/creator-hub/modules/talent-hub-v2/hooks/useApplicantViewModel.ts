import { useMemo } from 'react';
import { API_APPLICATION_STATUS_LABELS } from '../constants';
import type {
  ApiApplication,
  ApiApplicationListItem,
  ApplicantRowViewModel,
  StudioApplicantViewModel,
} from '../types';
import { getEnumLabel } from '../utils';
import { toTalentProfileViewModel } from './useTalentProfileViewModel';

function toDate(value: unknown): Date | undefined {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  const date = new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function getOptionalStringProperty(source: object, key: string): string {
  const value = Reflect.get(source, key);
  return typeof value === 'string' ? value : '';
}

function getApplicantUsername(item: ApiApplicationListItem): string {
  // The generated list-item type does not yet include a username field in all
  // environments. Only display a real backend-provided username, never derive
  // an @handle from display name.
  return (
    getOptionalStringProperty(item, 'talentUsername') ||
    getOptionalStringProperty(item, 'robloxUsername') ||
    getOptionalStringProperty(item, 'username')
  );
}

/**
 * Projects a list-item row (what `/api/Applications` returns on the list
 * endpoint) into a UI-ready shape. Fills in safe defaults for the many
 * optional/nullable API fields so table cells never have to null-check.
 */
export function toApplicantRowViewModel(item: ApiApplicationListItem): ApplicantRowViewModel {
  return {
    id: item.id ?? '',
    jobTitle: item.jobTitle ?? '',
    studioName: item.studioName ?? '',
    talentName: item.talentName ?? '',
    talentUsername: getApplicantUsername(item),
    talentUserId: item.talentUserId,
    submittedAt: toDate(item.createdAt),
    viewed: item.viewed ?? false,
    favorite: item.favorite ?? false,
  };
}

/**
 * Projects a full `Application` (from `/api/Applications/{id}`) with its
 * nested `TalentProfile` into a detail-panel view model. The list-item form
 * does NOT include the talent profile — callers must fetch the full
 * Application to drive the detail sheet.
 */
export function useStudioApplicantViewModel(
  application: ApiApplication | undefined,
): StudioApplicantViewModel | undefined {
  return useMemo<StudioApplicantViewModel | undefined>(() => {
    if (!application) {
      return undefined;
    }
    const tp = application.talentProfile;
    // The /api/Applications/{id} response does NOT include the applicant's
    // roblox username — only userId + displayName on the nested profile.
    // Pass an empty username so the "@handle" line in the detail sheet is
    // suppressed until the backend exposes the real handle. Using
    // displayName here produces malformed handles like "@Jordan Rivera".
    const talentViewModel = tp
      ? toTalentProfileViewModel(tp, '')
      : toTalentProfileViewModel(
          {
            userId: application.userId,
            displayName: '',
            bio: null,
            jobFunctions: null,
            location: null,
            socialLinks: null,
            website: null,
            availabilityStatus: undefined,
            skillTags: null,
            yearsOfExperience: null,
            preferredJobType: undefined,
            workExperiences: null,
            contactEmail: null,
            createdAt: undefined,
            updatedAt: undefined,
          },
          '',
        );

    return {
      id: application.id ?? '',
      jobId: application.jobId ?? undefined,
      resumeId: application.resumeId ?? undefined,
      submittedAt: toDate(application.createdAt),
      favorite: application.favorite ?? false,
      statusLabel:
        application.status !== undefined
          ? getEnumLabel(API_APPLICATION_STATUS_LABELS, application.status, 'Applied')
          : 'Applied',
      talentProfile: talentViewModel,
    };
  }, [application]);
}
