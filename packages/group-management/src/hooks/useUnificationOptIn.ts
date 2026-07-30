import { useCallback, useMemo, useState } from 'react';
import {
  useGetMigrationBreakingChanges,
  useGetMigrationStatus,
  useMigrateGroup,
} from '../queries/migrationQueries';
import type { BreakingChangeEntry } from '../utils/unificationUtils';
import { MIGRATION_STATUS, ModalState, isSnoozed, snooze } from '../utils/unificationUtils';

export type UseUnificationOptInOptions = {
  groupId: number;
};

export type UseUnificationOptInResult = {
  modalState: ModalState;
  breakingChanges: BreakingChangeEntry[];
  isLoading: boolean;
  onContinue: () => void;
  onAskLater: () => void;
};

export function useUnificationOptIn({
  groupId,
}: UseUnificationOptInOptions): UseUnificationOptInResult {
  const [isSnoozedState, setIsSnoozedState] = useState(() => isSnoozed(groupId));
  const [hasContinued, setHasContinued] = useState(false);
  const { mutate: migrateGroup } = useMigrateGroup();

  const { data: migrationStatus, isLoading: isStatusLoading } = useGetMigrationStatus(groupId);

  const status = migrationStatus?.status;
  const isNotMigrated = status === MIGRATION_STATUS.NOT_MIGRATED;
  const isMigrated = status === MIGRATION_STATUS.MIGRATED;

  const {
    data: breakingChangesData,
    isLoading: isBreakingChangesLoading,
    isError: isBreakingChangesError,
  } = useGetMigrationBreakingChanges(groupId, {
    enabled: isNotMigrated && !isSnoozedState,
  });

  const breakingChanges = useMemo(
    () => breakingChangesData?.breakingChanges ?? [],
    [breakingChangesData?.breakingChanges],
  );

  const modalState = useMemo<ModalState>(() => {
    if (!status || status === MIGRATION_STATUS.MIGRATING) {
      return ModalState.None;
    }

    if (isMigrated) {
      return ModalState.None;
    }

    if (isNotMigrated) {
      if (isBreakingChangesLoading || isBreakingChangesError || isSnoozedState || hasContinued) {
        return ModalState.None;
      }
      return breakingChanges.length > 0 ? ModalState.Breaking : ModalState.NonBreaking;
    }

    return ModalState.None;
  }, [
    status,
    isMigrated,
    isNotMigrated,
    isSnoozedState,
    hasContinued,
    isBreakingChangesLoading,
    isBreakingChangesError,
    breakingChanges.length,
  ]);

  const onContinue = useCallback(() => {
    migrateGroup(groupId);
    setHasContinued(true);
  }, [migrateGroup, groupId]);

  const onAskLater = useCallback(() => {
    snooze(groupId);
    setIsSnoozedState(true);
  }, [groupId]);

  return {
    modalState,
    breakingChanges,
    isLoading: isStatusLoading || isBreakingChangesLoading,
    onContinue,
    onAskLater,
  };
}
