import { useEffect, useMemo } from 'react';

import modalHistoryClient from '@clients/modalHistory';
import { useAppStore } from '@stores/appStoreProvider';
import type { CueDismissHandler, CueMigrationDefinition } from '@type/cueing';
import {
  logCueMigrationError,
  persistLegacyTooltipDismissal,
  syncLegacyTooltipDismissalToModalHistory,
} from '@utils/cueMigration';

export const useCueMigrationBackfill = (
  migration: CueMigrationDefinition,
  isCueingEnabled: boolean,
): void => {
  useEffect(() => {
    if (!isCueingEnabled) {
      return;
    }

    syncLegacyTooltipDismissalToModalHistory({
      legacyStorageKey: migration.legacyStorageKey,
      modalId: migration.modalId,
      recordUserSeenModal: modalHistoryClient.recordUserSeenModal,
    }).catch(() => undefined);
  }, [isCueingEnabled, migration.legacyStorageKey, migration.modalId]);
};

export const useCueMigrationMetadataReady = (): boolean =>
  useAppStore((state) => !state.appMetadataState.isLoading);

export const useCueMigrationCueingEnabled = (migration: CueMigrationDefinition): boolean =>
  useAppStore((state) => migration.selectIsCueingEnabled(state.appMetadataState?.data));

export const useCueMigrationDismissHandler = (
  migration: CueMigrationDefinition,
): CueDismissHandler =>
  useMemo(
    () => ({
      prepareDismiss: () => {
        try {
          persistLegacyTooltipDismissal(migration.legacyStorageKey);
          return true;
        } catch (error) {
          logCueMigrationError(
            'cueMigration_prepareDismiss',
            {
              legacyStorageKey: migration.legacyStorageKey,
              modalId: migration.modalId,
            },
            error,
          );
          return false;
        }
      },
    }),
    [migration.legacyStorageKey, migration.modalId],
  );
