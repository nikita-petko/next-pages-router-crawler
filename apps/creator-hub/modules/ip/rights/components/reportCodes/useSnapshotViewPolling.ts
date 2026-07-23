import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rightsClient } from '@modules/clients';
import type { SnapshotView } from '@rbx/clients/rightsV1';

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 10;

const SnapshotViewStatus = {
  Pending: 'Pending',
  Success: 'Success',
  Expired: 'Expired',
  Error: 'Error',
} as const;

export const snapshotViewQueryKey = (viewId: string) => ['snapshotView', viewId];

/**
 * Polls `getSnapshotView` until the view resolves from "Pending" to a terminal
 * status ("Success", "Expired", "Error"), or until MAX_POLLS is reached as a
 * client-side safety net.
 */
export const useSnapshotViewPolling = (viewId: string | undefined) => {
  const pollCountRef = useRef(0);
  const prevViewIdRef = useRef(viewId);

  if (prevViewIdRef.current !== viewId) {
    prevViewIdRef.current = viewId;
    pollCountRef.current = 0;
  }

  const query = useQuery<SnapshotView>({
    queryKey: snapshotViewQueryKey(viewId ?? ''),
    queryFn: () => {
      pollCountRef.current += 1;
      return rightsClient.getSnapshotView(viewId!);
    },
    enabled: !!viewId,
    refetchInterval: (q) => {
      if (pollCountRef.current >= MAX_POLLS) {
        return false;
      }
      const view = q.state.data;
      if (!view || view.status === SnapshotViewStatus.Pending) {
        return POLL_INTERVAL_MS;
      }
      return false;
    },
  });

  const isTimedOut =
    pollCountRef.current >= MAX_POLLS && query.data?.status === SnapshotViewStatus.Pending;

  return { ...query, isTimedOut };
};

export default useSnapshotViewPolling;
