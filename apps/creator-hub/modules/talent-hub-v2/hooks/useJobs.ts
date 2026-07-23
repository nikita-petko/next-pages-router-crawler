import { skipToken, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { jobsApi } from '../api/talentHubClient';
import type { Job, ListJobsResponse, JobsListJobsRequest } from '../types';
import { isMocksEnabled, isNoJobsMockEnabled, isRuntimeMocksQueryEnabled } from '../utils';

const QUERY_KEYS = {
  jobs: {
    list: (params?: JobsListJobsRequest, mocks?: boolean, noJobs?: boolean) =>
      ['talent-hub-v2', 'jobs', params, { mocks, noJobs }] as const,
    detail: (id: string, mocks?: boolean) =>
      ['talent-hub-v2', 'jobs', 'detail', id, { mocks }] as const,
  },
};

function useClientReady(): boolean {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => setIsReady(true), []);
  return isReady;
}

function filterMockJobs(jobs: Job[], params: JobsListJobsRequest): Job[] {
  let filtered = jobs;

  if (Array.isArray(params.studioId) && params.studioId.length > 0) {
    const studioSet = new Set(params.studioId);
    filtered = filtered.filter((job) => !!job.studioId && studioSet.has(job.studioId));
  }

  if (Array.isArray(params.location) && params.location.length > 0) {
    const locationSet = new Set(params.location);
    filtered = filtered.filter((job) => !!job.location && locationSet.has(job.location));
  }

  // eslint-disable-next-line no-underscore-dangle -- generated API request field name
  if (Array.isArray(params._function) && params._function.length > 0) {
    // eslint-disable-next-line no-underscore-dangle -- generated API request field name
    const functionSet = new Set(params._function);
    // eslint-disable-next-line no-underscore-dangle -- generated API model field name
    filtered = filtered.filter((job) => job._function != null && functionSet.has(job._function));
  }

  if (Array.isArray(params.status) && params.status.length > 0) {
    const statusSet = new Set(params.status);
    filtered = filtered.filter((job) => job.status != null && statusSet.has(job.status));
  }

  return filtered;
}

export function useJobs(params: JobsListJobsRequest = {}) {
  const isClientReady = useClientReady();
  const router = useRouter();
  const mocks = isMocksEnabled() || isRuntimeMocksQueryEnabled(router.query.mocks);
  const noJobs = isNoJobsMockEnabled();
  return useQuery<ListJobsResponse>({
    queryKey: QUERY_KEYS.jobs.list(params, mocks, noJobs),
    queryFn: async () => {
      if (mocks) {
        const { MOCK_JOBS_V2, MOCK_JOBS_RESPONSE_V2 } = await import('../mocks/mockData');
        return {
          ...MOCK_JOBS_RESPONSE_V2,
          jobs: noJobs ? [] : filterMockJobs(MOCK_JOBS_V2, params),
        };
      }
      return jobsApi.apiJobsGet(params);
    },
    enabled: isClientReady,
  });
}

export function useJob(jobId: string | undefined) {
  const isClientReady = useClientReady();
  const router = useRouter();
  const mocks = isMocksEnabled() || isRuntimeMocksQueryEnabled(router.query.mocks);
  return useQuery<Job>({
    queryKey: jobId
      ? QUERY_KEYS.jobs.detail(jobId, mocks)
      : ['talent-hub-v2', 'jobs', 'detail', 'none'],
    queryFn:
      jobId || mocks
        ? async () => {
            if (mocks) {
              const { MOCK_JOBS_V2 } = await import('../mocks/mockData');
              const found = MOCK_JOBS_V2.find((j) => j.id === jobId);
              if (found) {
                return found;
              }
              return MOCK_JOBS_V2[0];
            }
            if (!jobId) {
              throw new Error('Missing required job id');
            }
            return jobsApi.apiJobsIdGet({ id: jobId });
          }
        : skipToken,
    enabled: isClientReady,
  });
}
