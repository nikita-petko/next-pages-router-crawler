/**
 * Inbox hooks re-wired onto the real `/api/Applications` endpoint.
 *
 * Background: master's original `useInbox` / `useStudioInbox` hit
 * `/api/Inbox` and `/api/Studios/{id}/Inbox`, neither of which exists on
 * the backend. The actual backend surface is a single
 * `GET /api/Applications` that accepts a `jobId` filter. This module wraps
 * it so callers don't need to know about the fan-out or about the fact that
 * the studio-scoped variant is synthetic.
 *
 * Shape produced by each hook:
 *   - `useTalentApplied`: one query per caller, no jobId -> talent-scoped
 *     list (the caller's own applications).
 *   - `useStudioInbox(studioId)`: parallel queries — one per job the studio
 *     owns. Results are concatenated client-side. This is the price of the
 *     missing studio-scoped endpoint; if the studio owns many jobs, pagination
 *     per-job still applies.
 *   - `useSubmitApplication`: one-shot POST `/api/Applications`.
 *   - `useToggleApplicantFavorite`: POST `/favorite` or `/unfavorite`.
 */
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationsClient } from '../api/applicationsClient';
import { th2QueryKeys } from '../queryKeys';
import type {
  ApiApplication,
  ApiApplicationListItem,
  ApiCreateApplicationRequest,
  ApiListApplicationsResponse,
} from '../types';
import { JobStatus } from '../types';
import { isMocksEnabled, TH2_QUERY_OPTIONS } from '../utils';
import { useJobs } from './useJobs';

/** The talent's own "Applied" list. No jobId filter = auth-scoped list. */
export function useTalentApplied() {
  const mocks = isMocksEnabled();
  return useQuery<ApiListApplicationsResponse>({
    queryKey: th2QueryKeys.applications.list({ scope: 'mine' }),
    queryFn: async () => {
      if (mocks) {
        const { MOCK_APPLICATION_LIST_ITEMS } = await import('../mocks/mockData');
        return { items: MOCK_APPLICATION_LIST_ITEMS, nextPageToken: null };
      }
      return applicationsClient.listApplications({});
    },
    ...TH2_QUERY_OPTIONS,
  });
}

/**
 * Aggregated studio inbox across every job a studio owns.
 *
 * Backend has no `/api/Studios/{id}/Inbox`, so we fetch the studio's jobs,
 * then spawn one `GET /api/Applications?jobId={id}` per job. The resulting
 * list items are concatenated and annotated with their source `jobId` (the
 * list endpoint itself does NOT return jobId on `ApplicationListItem` — we
 * stamp it from the query variable).
 */
export type StudioInboxItem = ApiApplicationListItem & { jobId: string };
export type StudioInboxResult = {
  applicants: StudioInboxItem[];
  isFetching: boolean;
  isInitialLoading: boolean;
  isError: boolean;
  refetchAll: () => Promise<void>;
};

export function useStudioInbox(studioId: string | undefined): StudioInboxResult {
  const mocks = isMocksEnabled();
  const { data: jobsData, isFetching: isJobsFetching } = useJobs(
    studioId ? { studioId: [studioId], status: [JobStatus.NUMBER_0, JobStatus.NUMBER_1] } : {},
  );

  const jobIds = (jobsData?.jobs ?? []).map((j) => j.id).filter((id): id is string => Boolean(id));

  const queries = useQueries({
    queries: jobIds.map((jobId) => ({
      queryKey: th2QueryKeys.applications.list({ jobId }),
      queryFn: async () => {
        if (mocks) {
          const { MOCK_STUDIO_APPLICATIONS_BY_JOB_ID } = await import('../mocks/mockData');
          return { items: MOCK_STUDIO_APPLICATIONS_BY_JOB_ID[jobId] ?? [], nextPageToken: null };
        }
        return applicationsClient.listApplications({ jobId });
      },
      enabled: Boolean(studioId),
      ...TH2_QUERY_OPTIONS,
    })),
  });

  const applicants: StudioInboxItem[] = [];
  let isFetching = isJobsFetching;
  const isInitialLoading =
    (isJobsFetching && !jobsData) || queries.some((q) => q.isFetching && !q.data);
  let isError = false;

  queries.forEach((q, idx) => {
    if (q.isFetching) {
      isFetching = true;
    }
    if (q.isError) {
      isError = true;
    }
    const items = q.data?.items ?? [];
    items.forEach((item) => {
      if (item.id) {
        applicants.push({ ...item, jobId: jobIds[idx] });
      }
    });
  });

  const refetchAll = async () => {
    await Promise.all(queries.map((q) => q.refetch()));
  };

  return { applicants, isFetching, isInitialLoading, isError, refetchAll };
}

export function useSubmitApplication() {
  const queryClient = useQueryClient();
  return useMutation<ApiApplication, Error, ApiCreateApplicationRequest>({
    mutationFn: async (payload) => {
      if (isMocksEnabled()) {
        return {
          id: `mock-app-${Date.now()}`,
          jobId: payload.jobId,
          userId: 123,
          resumeId: payload.resumeId ?? null,
          status: 0,
          consentToShareSignal: payload.consentToShareSignal ?? false,
          favorite: false,
          lastViewedAt: undefined,
          createdAt: new Date(),
        } satisfies ApiApplication;
      }
      return applicationsClient.createApplication(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: th2QueryKeys.applications.all });
    },
  });
}

/**
 * Recruiter toggles an applicant as "starred" (favorite) / unstarred.
 * Backend has only these two verbs — there is no separate "rejected" or
 * "not interested" state, just the favorite flag.
 */
export function useToggleApplicantFavorite() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { applicationId: string; favorite: boolean }>({
    mutationFn: async ({ applicationId, favorite }) => {
      if (isMocksEnabled()) {
        return;
      }
      if (favorite) {
        await applicationsClient.favoriteApplication(applicationId);
      } else {
        await applicationsClient.unfavoriteApplication(applicationId);
      }
    },
    onMutate: async ({ applicationId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: th2QueryKeys.applications.all });
      queryClient.setQueriesData<ApiListApplicationsResponse>(
        { queryKey: th2QueryKeys.applications.all },
        (old) => {
          if (!old) {
            return old;
          }
          const items = old.items ?? [];
          return {
            ...old,
            items: items.map((it) => (it.id === applicationId ? { ...it, favorite } : it)),
          };
        },
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: th2QueryKeys.applications.all });
    },
  });
}
