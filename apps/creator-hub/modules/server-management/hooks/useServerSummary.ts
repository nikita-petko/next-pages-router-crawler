import { queryOptions, skipToken, useQuery } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';

const SERVER_SUMMARY_GC_TIME_MS = 30_000;

export type ServerSummaryIdentity = {
  universeId: number | string;
  placeId: number;
  jobId: string;
};

export type ServerSummary = {
  jobId: string;
  serverType: string;
  status: string;
  isShutdown: boolean;
};

export const getServerSummaryQueryKey = ({ universeId, placeId, jobId }: ServerSummaryIdentity) =>
  ['server-management', 'server-summary', String(universeId), placeId, jobId] as const;

export const getServerSummaryQueryOptions = (identity: ServerSummaryIdentity) =>
  queryOptions<ServerSummary>({
    queryKey: getServerSummaryQueryKey(identity),
    queryFn: skipToken,
    enabled: false,
    gcTime: SERVER_SUMMARY_GC_TIME_MS,
    staleTime: Infinity,
  });

export const seedServerSummary = (
  queryClient: QueryClient,
  identity: ServerSummaryIdentity,
  summary: ServerSummary,
): void => {
  const queryKey = getServerSummaryQueryKey(identity);
  // defaults must land before setQueryData or RQ falls back to 5m browser gcTime
  queryClient.setQueryDefaults(queryKey, {
    gcTime: SERVER_SUMMARY_GC_TIME_MS,
    staleTime: Infinity,
  });
  queryClient.setQueryData(queryKey, summary);
};

const useServerSummary = (identity: ServerSummaryIdentity) =>
  useQuery(getServerSummaryQueryOptions(identity));

export default useServerSummary;
