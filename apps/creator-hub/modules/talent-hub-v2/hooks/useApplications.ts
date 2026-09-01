import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationsClient } from '../api/applicationsClient';
import { th2QueryKeys } from '../queryKeys';
import type {
  ApiApplication,
  ApiApplicationListItem,
  ApiCreateApplicationRequest,
  ApiListApplicationsParams,
  ApiListApplicationsResponse,
} from '../types';
import { isMocksEnabled, TH2_QUERY_OPTIONS } from '../utils';

export function useListApplications(params: ApiListApplicationsParams = {}) {
  const mocks = isMocksEnabled();
  return useQuery<ApiListApplicationsResponse>({
    queryKey: th2QueryKeys.applications.list(params),
    queryFn: async () => {
      if (mocks) {
        const { MOCK_APPLICATION_LIST_ITEMS, MOCK_STUDIO_APPLICATIONS_BY_JOB_ID } =
          await import('../mocks/mockData');
        const items = params.jobId
          ? (MOCK_STUDIO_APPLICATIONS_BY_JOB_ID[params.jobId] ?? [])
          : MOCK_APPLICATION_LIST_ITEMS;
        return { items, nextPageToken: null };
      }
      return applicationsClient.listApplications(params);
    },
    ...TH2_QUERY_OPTIONS,
  });
}

export function useGetApplication(id: string | undefined) {
  const mocks = isMocksEnabled();
  return useQuery<ApiApplication>({
    queryKey: id
      ? th2QueryKeys.applications.detail(id)
      : th2QueryKeys.applications.detailPlaceholder,
    queryFn: id
      ? async () => {
          if (mocks) {
            const { MOCK_APPLICATION_DETAIL, MOCK_APPLICATION_JOB_ID_BY_ID } =
              await import('../mocks/mockData');
            return {
              ...MOCK_APPLICATION_DETAIL,
              id,
              jobId: MOCK_APPLICATION_JOB_ID_BY_ID[id] ?? MOCK_APPLICATION_DETAIL.jobId,
            };
          }
          return applicationsClient.getApplication(id);
        }
      : skipToken,
    enabled: Boolean(id),
    ...TH2_QUERY_OPTIONS,
  });
}

/**
 * Returns whether the current (auth-scoped) talent user already has an
 * application for the given job.
 *
 * Real backend: use the viewer's own applications, then fetch details to match
 * jobId. Avoid `GET /api/Applications?jobId={id}` here: for studio owners that
 * endpoint can return all applicants for the job, causing false "Applied" UI.
 * Mocks: derive from the talent-facing mock list (not studio inbox data), so we
 * only mark jobs that appear in `MOCK_APPLICATION_LIST_ITEMS` as applied.
 */
export function useHasAppliedToJob(jobId: string | undefined, enabled = true) {
  const mocks = isMocksEnabled();
  return useQuery<boolean>({
    queryKey: ['talent-hub-v2', 'applications', 'has-applied', jobId],
    queryFn: async () => {
      if (!jobId) {
        return false;
      }
      if (mocks) {
        const { MOCK_APPLICATION_LIST_ITEMS, MOCK_APPLICATION_JOB_ID_BY_ID } =
          await import('../mocks/mockData');
        return MOCK_APPLICATION_LIST_ITEMS.some(
          (item) => !!item.id && MOCK_APPLICATION_JOB_ID_BY_ID[item.id] === jobId,
        );
      }
      const response = await applicationsClient.listApplications({});
      const applications = response.items ?? [];
      const inlineMatch = applications.some((item) => {
        const itemJobId = Reflect.get(Object(item), 'jobId');
        return itemJobId === jobId;
      });
      if (inlineMatch) {
        return true;
      }

      const details = await Promise.all(
        applications
          .map((item) => item.id)
          .filter((id): id is string => Boolean(id))
          .map((id) => applicationsClient.getApplication(id).catch(() => null)),
      );
      return details.some((application) => application?.jobId === jobId);
    },
    enabled: enabled && Boolean(jobId),
    ...TH2_QUERY_OPTIONS,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  const mocks = isMocksEnabled();

  return useMutation({
    mutationFn: async (payload: ApiCreateApplicationRequest) => {
      if (mocks) {
        const { MOCK_TALENT_PROFILE_V2 } = await import('../mocks/mockData');
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
          talentProfile: MOCK_TALENT_PROFILE_V2,
        } satisfies ApiApplication;
      }
      return applicationsClient.createApplication(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: th2QueryKeys.applications.all });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const mocks = isMocksEnabled();

  return useMutation({
    mutationFn: async ({ id, favorite }: { id: string; favorite: boolean }) => {
      if (mocks) {
        return;
      }
      if (favorite) {
        await applicationsClient.favoriteApplication(id);
      } else {
        await applicationsClient.unfavoriteApplication(id);
      }
      return;
    },
    onMutate: async ({ id, favorite }) => {
      // Optimistic update — match all `list(...)` cache entries under the
      // `applications` root, not just the empty-params list. The queryKey
      // used by `useListApplications({jobId})` includes the params object,
      // so we have to target the shared prefix to hit every variant.
      await queryClient.cancelQueries({ queryKey: th2QueryKeys.applications.all });
      queryClient.setQueriesData<ApiListApplicationsResponse>(
        { queryKey: th2QueryKeys.applications.all },
        (old: ApiListApplicationsResponse | undefined) => {
          if (!old) {
            return old;
          }
          const items = old.items ?? [];
          return {
            ...old,
            items: items.map((item: ApiApplicationListItem) =>
              item.id === id ? { ...item, favorite } : item,
            ),
          };
        },
      );
      // Also update the detail entry if cached, so the side panel reflects
      // the new favorite state immediately.
      queryClient.setQueryData<ApiApplication>(th2QueryKeys.applications.detail(id), (old) =>
        old ? { ...old, favorite } : old,
      );
    },
    onSettled: (_data, _err, variables) => {
      // In mocks mode we have no server round-trip, so re-invalidating would
      // just re-fetch stale mock data and stomp the optimistic update. Skip.
      if (mocks) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: th2QueryKeys.applications.all });
      queryClient.invalidateQueries({
        queryKey: th2QueryKeys.applications.detail(variables.id),
      });
    },
  });
}

export function useWithdrawApplication() {
  const queryClient = useQueryClient();
  const mocks = isMocksEnabled();

  return useMutation({
    mutationFn: async (id: string) => {
      if (mocks) {
        return;
      }
      await applicationsClient.withdrawApplication(id);
      return;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: th2QueryKeys.applications.all });
      queryClient.setQueriesData<ApiListApplicationsResponse>(
        { queryKey: th2QueryKeys.applications.all },
        (old: ApiListApplicationsResponse | undefined) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            items: (old.items ?? []).filter((item) => item.id !== id),
          };
        },
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: th2QueryKeys.applications.all });
    },
  });
}
