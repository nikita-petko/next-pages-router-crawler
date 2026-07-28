import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  createUniverseRegex,
  deleteUniverseRegex,
  findUniverseRegexes,
  ignoreUniverseRegex,
  LogAttributeApiError,
  RegexStatus,
  reorderUniverseRegex,
  updateUniverseRegex,
  type CreateUniverseRegexRequest,
  type DeleteUniverseRegexRequest,
  type IgnoreUniverseRegexRequest,
  type ReorderUniverseRegexRequest,
  type UniverseRegex,
  type UniverseRegexMutationResponse,
  type UpdateUniverseRegexRequest,
} from '@modules/clients/analytics/logAttribute';

const UNIVERSE_REGEXES_QUERY_KEY = ['universeRegexes'] as const;

const STALE_TIME_MS = 30_000;

// log-attribute-http-service is prone to transient 5xx during pod cold starts.
// Retry generously on 5xx/network errors with jitter, but never on 4xx (the
// request is wrong and a retry won't help).
const MAX_RETRIES = 5;
const RETRY_BASE_DELAY_MS = 500;
const RETRY_MAX_DELAY_MS = 5_000;

const isRetriableError = (error: unknown): boolean => {
  if (error instanceof LogAttributeApiError) {
    return error.status >= 500;
  }
  return true;
};

export const universeRegexesQueryKey = (universeId: number, status: RegexStatus) =>
  [...UNIVERSE_REGEXES_QUERY_KEY, universeId, status] as const;

export type UseUniverseRegexesQueryParams = {
  universeId: number;
  status?: RegexStatus;
  enabled?: boolean;
};

export const useUniverseRegexesQuery = ({
  enabled = true,
  universeId,
  status = RegexStatus.CreatorCreated,
}: UseUniverseRegexesQueryParams): UseQueryResult<UniverseRegex[]> => {
  return useQuery({
    queryKey: universeRegexesQueryKey(universeId, status),
    queryFn: () => findUniverseRegexes({ universeId, status }),
    staleTime: STALE_TIME_MS,
    enabled: enabled && Number.isFinite(universeId) && universeId > 0,
    retry: (failureCount, error) => failureCount < MAX_RETRIES && isRetriableError(error),
    retryDelay: (attemptIndex) =>
      Math.min(RETRY_BASE_DELAY_MS * 2 ** attemptIndex, RETRY_MAX_DELAY_MS),
  });
};

export type CreateUniverseRegexInput = Omit<CreateUniverseRegexRequest, 'universeId'>;

export const useCreateUniverseRegexMutation = (
  universeId: number,
): UseMutationResult<UniverseRegexMutationResponse, Error, CreateUniverseRegexInput> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUniverseRegexInput) => createUniverseRegex({ ...input, universeId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...UNIVERSE_REGEXES_QUERY_KEY, universeId],
      });
    },
  });
};

export const useUpdateUniverseRegexMutation = (
  universeId: number,
): UseMutationResult<UniverseRegexMutationResponse, Error, UpdateUniverseRegexRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUniverseRegexRequest) => updateUniverseRegex(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...UNIVERSE_REGEXES_QUERY_KEY, universeId],
      });
    },
  });
};

export const useDeleteUniverseRegexMutation = (
  universeId: number,
): UseMutationResult<void, Error, DeleteUniverseRegexRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteUniverseRegexRequest) => deleteUniverseRegex(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...UNIVERSE_REGEXES_QUERY_KEY, universeId],
      });
    },
  });
};

export const useIgnoreUniverseRegexMutation = (
  universeId: number,
): UseMutationResult<void, Error, IgnoreUniverseRegexRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IgnoreUniverseRegexRequest) => ignoreUniverseRegex(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...UNIVERSE_REGEXES_QUERY_KEY, universeId],
      });
    },
  });
};

export const useReorderUniverseRegexMutation = (
  universeId: number,
): UseMutationResult<UniverseRegexMutationResponse, Error, ReorderUniverseRegexRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReorderUniverseRegexRequest) => reorderUniverseRegex(input),
    // Resync to server order on both success and failure: success confirms the
    // optimistic move, failure reverts it.
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: [...UNIVERSE_REGEXES_QUERY_KEY, universeId],
      });
    },
  });
};
