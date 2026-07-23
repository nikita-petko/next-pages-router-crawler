import { useMemo } from 'react';
import {
  API_JOB_FUNCTION_LABELS,
  API_JOB_TYPE_LABELS,
  API_LOCATION_TYPE_LABELS,
  API_JOB_STATUS_LABELS,
} from '../constants';
import type { Job, JobViewModel } from '../types';
import {
  getEnumLabel,
  isJobWorkArrangement,
  parseStoredJobLocation,
  splitDescriptionWorkLocation,
} from '../utils';

export function toJobViewModel(job: Job): JobViewModel {
  const jobFunction = job._function; // eslint-disable-line no-underscore-dangle -- generated API field name
  const rawStudio = job.studio as
    | (Job['studio'] & {
        group?: string | null;
      })
    | undefined;
  const { arrangement, legacyDetailFromLocationField } = parseStoredJobLocation(job.location);
  const { body: description, detail: detailFromDescription } = splitDescriptionWorkLocation(
    job.description,
  );
  const locationArrangementLabel = isJobWorkArrangement(job.location ?? '')
    ? (job.location ?? 'Remote')
    : getEnumLabel(API_LOCATION_TYPE_LABELS, Number(job.location), arrangement || 'Remote');
  const locationDetail = detailFromDescription || legacyDetailFromLocationField;
  return {
    id: job.id ?? '',
    studioId: job.studioId ?? '',
    title: job.title ?? 'Untitled role',
    functionLabel: getEnumLabel(
      API_JOB_FUNCTION_LABELS,
      jobFunction as number,
      `Unknown (${jobFunction})`,
    ),
    jobTypeLabel: getEnumLabel(
      API_JOB_TYPE_LABELS,
      job.jobType as number,
      `Unknown (${job.jobType})`,
    ),
    locationLabel: locationDetail
      ? `${locationArrangementLabel} - ${locationDetail}`
      : locationArrangementLabel,
    location: job.location ?? undefined,
    applyMethod: job.applyMethod ?? undefined,
    description: description || undefined,
    responsibilities: job.responsibilities ?? undefined,
    qualifications: job.qualifications ?? undefined,
    statusLabel: getEnumLabel(API_JOB_STATUS_LABELS, job.status as number, 'Unknown'),
    updatedAt: job.updatedAt ?? new Date(),
    createdAt: job.createdAt ?? new Date(),
    studioName: job.studio?.name ?? undefined,
    studioLogo: job.studio?.logo ?? undefined,
    studioGroupId: job.studio?.groupId ?? undefined,
    studioGroupHref: rawStudio?.group ?? undefined,
    studioDescription: job.studio?.description ?? undefined,
  };
}

export function useJobViewModel(job: Job | undefined): JobViewModel | undefined {
  return useMemo(() => (job ? toJobViewModel(job) : undefined), [job]);
}

export function useJobsViewModel(jobs: Job[] = []): JobViewModel[] {
  return useMemo(() => jobs.map(toJobViewModel), [jobs]);
}
