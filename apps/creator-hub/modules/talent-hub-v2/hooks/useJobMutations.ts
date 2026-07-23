import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateJobRequest, UpdateJobRequest } from '@rbx/client-talent-hub-v2-service/v2';
import { jobsApi } from '../api/talentHubClient';
import { th2QueryKeys } from '../queryKeys';
import type { Job } from '../types';
import { isMocksEnabled } from '../utils';

type CloseJobPayload = Parameters<typeof jobsApi.apiJobsIdClosePost>[0]['jobCloseSurvey'];

function isJob(value: unknown): value is Job {
  return typeof value === 'object' && value !== null && 'id' in value;
}

function isJobListResponse(value: unknown): value is { jobs: Job[] } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'jobs' in value &&
    Array.isArray((value as { jobs?: unknown }).jobs)
  );
}

function isAlreadyClosedJobError(err: unknown): boolean {
  return err instanceof Error && err.message.toLowerCase().includes('already closed');
}

function updateClosedJobInCache(old: unknown, closedJob: Job): unknown {
  if (isJobListResponse(old)) {
    return {
      ...old,
      jobs: old.jobs.map((job) =>
        job.id === closedJob.id
          ? { ...job, status: closedJob.status, updatedAt: closedJob.updatedAt }
          : job,
      ),
    };
  }
  if (isJob(old) && old.id === closedJob.id) {
    return { ...old, status: closedJob.status, updatedAt: closedJob.updatedAt };
  }
  return old;
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  const mocks = isMocksEnabled();

  return useMutation({
    mutationFn: async (payload: CreateJobRequest) => {
      if (mocks) {
        return {
          id: `mock-job-${Date.now()}`,
          title: payload.title,
          status: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        } satisfies Job;
      }
      return jobsApi.apiJobsPost({ createJobRequest: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: th2QueryKeys.jobs.all });
    },
  });
}

export function useUpdateJob(jobId: string | undefined) {
  const queryClient = useQueryClient();
  const mocks = isMocksEnabled();

  return useMutation({
    mutationFn: async (payload: UpdateJobRequest) => {
      if (!jobId) {
        throw new Error('Job ID required');
      }
      if (mocks) {
        const { MOCK_JOBS_V2 } = await import('../mocks/mockData');
        const existing = MOCK_JOBS_V2.find((j) => j.id === jobId) ?? MOCK_JOBS_V2[0];
        return { ...existing, ...payload, updatedAt: new Date() } satisfies Job;
      }
      return jobsApi.apiJobsIdPut({ id: jobId, updateJobRequest: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: th2QueryKeys.jobs.all });
    },
  });
}

export function useCloseJob(jobId: string | undefined) {
  const queryClient = useQueryClient();
  const mocks = isMocksEnabled();

  return useMutation({
    mutationFn: async (payload?: CloseJobPayload) => {
      if (!jobId) {
        throw new Error('Job ID required');
      }
      if (mocks) {
        const { MOCK_JOBS_V2 } = await import('../mocks/mockData');
        const existing = MOCK_JOBS_V2.find((j) => j.id === jobId) ?? MOCK_JOBS_V2[0];
        return {
          ...existing,
          status: 1,
          updatedAt: new Date(),
        } satisfies Job;
      }
      try {
        await jobsApi.apiJobsIdClosePost({ id: jobId, jobCloseSurvey: payload });
      } catch (err) {
        if (!isAlreadyClosedJobError(err)) {
          throw err;
        }
      }
      return;
    },
    onSuccess: (closedJob) => {
      if (mocks && closedJob) {
        queryClient.setQueriesData({ queryKey: th2QueryKeys.jobs.all }, (old) =>
          updateClosedJobInCache(old, closedJob),
        );
        return;
      }
      queryClient.invalidateQueries({ queryKey: th2QueryKeys.jobs.all });
    },
  });
}
