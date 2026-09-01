import { API_JOB_FUNCTION_LABELS, getUniqueJobFunctionOptions } from '../../constants';
import {
  AvailabilityStatus,
  type ApiTalentProfileCreateRequest,
  type ApiTalentProfile,
  type JobFunction,
  type JobType,
  type WorkExperience,
} from '../../types';

export type FormState = {
  displayName: string;
  jobFunction: string;
  bio: string;
  contactEmail: string;
  location: string;
  website: string;
  relocationChoice: 'no' | 'yes' | 'remoteOnly';
  workExperienceIdText: string;
  workExperiences: Array<{
    universeId: number;
    title: string;
  }>;
  preferredJobType: JobType;
};

export const EMPTY_FORM_STATE: FormState = {
  displayName: '',
  jobFunction: '',
  bio: '',
  contactEmail: '',
  location: '',
  website: '',
  relocationChoice: 'yes',
  workExperienceIdText: '',
  workExperiences: [],
  preferredJobType: 0,
};

export const JOB_FUNCTION_OPTIONS = getUniqueJobFunctionOptions();

export function isJobFunction(value: number): value is JobFunction {
  return Object.hasOwn(API_JOB_FUNCTION_LABELS, value);
}

export function initialStateFrom(profile: ApiTalentProfile | undefined): FormState {
  if (!profile) {
    return EMPTY_FORM_STATE;
  }
  const firstJobFunction = profile.jobFunctions?.[0];
  let relocationChoice: FormState['relocationChoice'] = 'yes';
  if (profile.availabilityStatus === AvailabilityStatus.NUMBER_1) {
    relocationChoice = 'no';
  } else if ((profile.location ?? '').toLowerCase().includes('remote')) {
    relocationChoice = 'remoteOnly';
  }
  const workExperiences = (profile.workExperiences ?? [])
    .map((item) => {
      const universeId = Number(item.universeId);
      if (!Number.isFinite(universeId) || universeId <= 0) {
        return null;
      }
      return {
        universeId,
        title: (item.title ?? `Experience ${universeId}`).trim() || `Experience ${universeId}`,
      };
    })
    .filter((item): item is { universeId: number; title: string } => Boolean(item));
  return {
    displayName: profile.displayName ?? '',
    jobFunction:
      firstJobFunction != null && API_JOB_FUNCTION_LABELS[firstJobFunction] != null
        ? String(firstJobFunction)
        : '',
    bio: profile.bio ?? '',
    contactEmail: profile.contactEmail ?? '',
    location: profile.location ?? '',
    website: profile.website ?? '',
    relocationChoice,
    workExperienceIdText: '',
    workExperiences,
    preferredJobType: profile.preferredJobType ?? 0,
  };
}

export function formStateToPayload(form: FormState): ApiTalentProfileCreateRequest {
  const parsedJobFunction = Number(form.jobFunction);
  const jobFunctions = isJobFunction(parsedJobFunction) ? [parsedJobFunction] : [];
  const availabilityStatus =
    form.relocationChoice === 'no' ? AvailabilityStatus.NUMBER_1 : AvailabilityStatus.NUMBER_0;
  const resolvedLocation =
    form.relocationChoice === 'remoteOnly' && !form.location.trim()
      ? 'Remote'
      : form.location.trim();
  const workExperiences: WorkExperience[] = form.workExperiences.map((item) => ({
    universeId: item.universeId,
    title: item.title,
  }));
  return {
    displayName: form.displayName.trim(),
    bio: form.bio.trim() || null,
    jobFunctions,
    location: resolvedLocation || null,
    socialLinks: null,
    website: form.website.trim() || null,
    availabilityStatus,
    skillTags: null,
    yearsOfExperience: null,
    preferredJobType: form.preferredJobType,
    workExperiences: workExperiences.length ? workExperiences : null,
  };
}

export function isRelocationChoice(value: string): value is FormState['relocationChoice'] {
  return value === 'no' || value === 'yes' || value === 'remoteOnly';
}
