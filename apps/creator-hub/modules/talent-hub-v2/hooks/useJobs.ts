import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '../api/talentHubClient';
import type { Job, ListJobsResponse, JobsListJobsRequest } from '../types';
import { isMocksEnabled } from '../utils';

const QUERY_KEYS = {
  jobs: {
    list: (params?: JobsListJobsRequest, mocks?: boolean) =>
      ['talent-hub-v2', 'jobs', params, { mocks }] as const,
    detail: (id: string, mocks?: boolean) =>
      ['talent-hub-v2', 'jobs', 'detail', id, { mocks }] as const,
  },
};

export function useJobs(params: JobsListJobsRequest = {}) {
  const mocks = isMocksEnabled();
  return useQuery<ListJobsResponse>({
    queryKey: QUERY_KEYS.jobs.list(params, mocks),
    queryFn: async () => {
      if (mocks) {
        const { MOCK_JOBS_V2, MOCK_JOBS_RESPONSE_V2 } = await import('../mocks/mockData');
        return {
          ...MOCK_JOBS_RESPONSE_V2,
          jobs: MOCK_JOBS_V2,
        };
      }
      return jobsApi.apiJobsGet(params);
    },
  });
}

export function useJob(jobId: string | undefined) {
  const mocks = isMocksEnabled();
  return useQuery<Job>({
    queryKey: jobId
      ? QUERY_KEYS.jobs.detail(jobId, mocks)
      : ['talent-hub-v2', 'jobs', 'detail', 'none'],
    queryFn: async () => {
      if (!jobId) {
        throw new Error('Job ID is required.');
      }
      if (mocks) {
        const { MOCK_JOBS_V2 } = await import('../mocks/mockData');
        const found = MOCK_JOBS_V2.find((j) => j.id === jobId);
        if (found) return found;
        return MOCK_JOBS_V2[0];
      }
      return jobsApi.apiJobsIdGet({ id: jobId });
    },
    enabled: Boolean(jobId),
  });
}
