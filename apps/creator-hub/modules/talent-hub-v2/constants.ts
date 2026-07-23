// =============================================================================
// ENUM LABEL MAPPINGS (Swagger-aligned)
// =============================================================================

import type { JobFunction } from './types';

// Swagger provides numeric enums only; labels align to V1 naming where possible.
export const API_JOB_FUNCTION_LABELS: Record<number, string> = {
  0: 'Developer',
  1: 'Artist',
  2: 'Game Producer',
  3: 'Animator',
  4: 'Sound Designer',
  5: 'UI/UX Designer',
  6: 'QA Tester',
  7: 'Community Manager',
  8: 'Other',
  9: 'Other',
  10: 'Other',
  11: 'Other',
  12: 'Growth Marketing',
};

export function isJobFunction(value: number): value is JobFunction {
  return Object.hasOwn(API_JOB_FUNCTION_LABELS, value);
}

export function getUniqueJobFunctionOptions(): Array<[JobFunction, string]> {
  return Object.entries(API_JOB_FUNCTION_LABELS)
    .reduce<Array<[JobFunction, string]>>((options, [value, label]) => {
      const jobFunction = Number(value);
      if (isJobFunction(jobFunction)) {
        options.push([jobFunction, label]);
      }
      return options;
    }, [])
    .filter(
      ([value, label], _idx, arr) =>
        arr.findIndex(([, optionLabel]) => optionLabel === label) ===
        arr.findIndex(([optionValue]) => optionValue === value),
    )
    .toSorted(([, aLabel], [, bLabel]) => {
      if (aLabel === 'Other') {
        return 1;
      }
      if (bLabel === 'Other') {
        return -1;
      }
      return 0;
    });
}

export const API_JOB_TYPE_LABELS: Record<number, string> = {
  0: 'Full time',
  1: 'Part time',
};

export const API_LOCATION_TYPE_LABELS: Record<number, string> = {
  0: 'Remote',
  1: 'Onsite',
  2: 'Hybrid',
};

export const API_JOB_STATUS_LABELS: Record<number, string> = {
  0: 'Open',
  1: 'Closed',
};

// Swagger enum order (0-3) matches 1-10, 11-50, 51-100, 100+.
export const API_TEAM_SIZE_LABELS: Record<number, string> = {
  0: '1-10',
  1: '11-50',
  2: '51-100',
  3: '100+',
};

export const API_APPLICATION_STATUS_LABELS: Record<number, string> = {
  0: 'Applied',
  1: 'In review',
  2: 'Interview',
  3: 'Rejected',
  4: 'Accepted',
};

export const API_AVAILABILITY_STATUS_LABELS: Record<number, string> = {
  0: 'Available',
  1: 'Not available',
};

// =============================================================================
// EXTERNAL URLS
// =============================================================================

/**
 * Qualtrics studio onboarding survey.
 *
 * Studio creation + studio job-post onboarding both funnel through this single
 * survey today — the in-product `/api/Studios` POST flow is gated on manual
 * approval, so all "create studio" / "post your first job" CTAs redirect here.
 * Shared between `StudioOnboardingV2Container` (job-post flow) and
 * `StudioProfileCreate` on `/hire/my-studio` (studio-profile flow).
 */
export const STUDIO_ONBOARDING_SURVEY_URL = 'https://survey.roblox.com/jfe/form/SV_0fDCWscpfq22ttc';

// =============================================================================
// LAYOUT TOKENS
// =============================================================================

export const LOGO_SIZE_SMALL = 32;
export const LOGO_SIZE_MEDIUM = 40;
export const LOGO_SIZE_LARGE = 80;

export const CREATION_CARD_SIZE = 380;
