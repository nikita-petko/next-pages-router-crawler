import { JobStatus } from '../types';
import type { JobsListJobsRequest } from '../types';

export type TalentHubQuery = Record<string, string | string[] | undefined>;
export const TALENT_HUB_QUERY_KEYS = ['th2', 'th2m2', 'mocks', 'local'] as const;

export function buildTalentHubQueryString(query: TalentHubQuery): string {
  const qs = new URLSearchParams();
  TALENT_HUB_QUERY_KEYS.forEach((key) => {
    const value = query[key];
    if (typeof value === 'string') {
      qs.set(key, value);
    }
  });
  return qs.toString();
}

export function buildTalentHubHref(path: string, query: TalentHubQuery): string {
  const qs = buildTalentHubQueryString(query);
  return `${path}${qs ? `?${qs}` : ''}`;
}

export function getStudioJobsParams(studioId: string | undefined): JobsListJobsRequest {
  return studioId ? { studioId: [studioId], status: [JobStatus.NUMBER_0, JobStatus.NUMBER_1] } : {};
}

// Only accept a single string applicationId. A repeated query param
// (`?applicationId=a&applicationId=b`) arrives as an array, which we never
// want to coerce into a selection — treat it as "nothing selected".
export function getSelectedApplicationId(value: string | string[] | undefined): string | null {
  return typeof value === 'string' ? value : null;
}
