import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthentication } from '@modules/authentication/providers';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { getMomentsCreationsQueryKeyPrefix } from '@modules/react-query/momentsCreations/momentsCreationsQueries';
import {
  MomentCreationStatus,
  type MomentCreationStatusFilterTab,
  MomentCreationStatusFilterTabs,
} from '../types/MomentCreation';

const isMomentCreationStatusFilterTab = (value: string): value is MomentCreationStatusFilterTab =>
  MomentCreationStatusFilterTabs.some((tab) => tab === value);

const parseMomentStatusFilter = (
  value: string | string[] | undefined | null,
): MomentCreationStatusFilterTab => {
  const raw = value == null ? undefined : Array.isArray(value) ? value[0] : value;

  if (typeof raw === 'string' && isMomentCreationStatusFilterTab(raw)) {
    return raw;
  }

  return MomentCreationStatus.DRAFT;
};

export const useMomentsStatusFilter = () => {
  const [{ momentStatus }, setQueryParams] = useQueryParams(['momentStatus']);
  const queryClient = useQueryClient();
  const { user } = useAuthentication();

  const statusTab = parseMomentStatusFilter(momentStatus);

  const setStatusTab = useCallback(
    (status: MomentCreationStatusFilterTab) => {
      setQueryParams({ momentStatus: status });
      // Refetch moments when switching into the Active tab so freshly published
      // moments appear without waiting for a manual reload. The flag-agnostic prefix is used so the
      // invalidation lands regardless of which feed-id mode populated the cache.
      if (status === MomentCreationStatus.ACTIVE) {
        void queryClient.invalidateQueries({
          queryKey: getMomentsCreationsQueryKeyPrefix(user?.id),
        });
      }
    },
    [queryClient, setQueryParams, user?.id],
  );

  return { statusTab, setStatusTab };
};
