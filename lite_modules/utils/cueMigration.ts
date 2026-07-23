import { tryGetCueingConfiguration } from '@rbx/cueing/core';

import { EventName, logNativeErrorEvent } from '@clients/unifiedLogger';
import type { CueModalId } from '@constants/cueModalIds';
import { GetLocalStorage, SetLocalStorage } from '@utils/localStorage';

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

export const logCueMigrationError = (
  context: 'cueMigration_backfill' | 'cueMigration_prepareDismiss',
  parameters: Record<string, string>,
  error: unknown,
): void => {
  const normalizedError = toError(error);
  const onError = tryGetCueingConfiguration()?.onError;

  if (onError) {
    onError.log({ context, ...parameters }, normalizedError);
    return;
  }

  logNativeErrorEvent({
    error: normalizedError,
    eventName: EventName.ApiEvent,
    parameters: { context, ...parameters },
  });
};

export const getCueMigrationBackfillMarkerKey = (modalId: CueModalId) =>
  `cueMigrationBackfill:${modalId}`;

type CueMigrationBrowserEligibility = {
  legacyStorageKey: string;
  modalId: CueModalId;
};

export const shouldHideCueMigrationInBrowser = ({
  legacyStorageKey,
  modalId,
}: CueMigrationBrowserEligibility): boolean =>
  Boolean(GetLocalStorage(legacyStorageKey)) ||
  Boolean(GetLocalStorage(getCueMigrationBackfillMarkerKey(modalId)));

type SyncLegacyTooltipDismissalParams = {
  legacyStorageKey: string;
  modalId: CueModalId;
  recordUserSeenModal: (modalId: CueModalId) => Promise<boolean>;
};

export const syncLegacyTooltipDismissalToModalHistory = async ({
  legacyStorageKey,
  modalId,
  recordUserSeenModal,
}: SyncLegacyTooltipDismissalParams): Promise<void> => {
  const backfillMarkerKey = getCueMigrationBackfillMarkerKey(modalId);
  if (GetLocalStorage(backfillMarkerKey) || !GetLocalStorage(legacyStorageKey)) {
    return;
  }

  try {
    await recordUserSeenModal(modalId);
    SetLocalStorage(backfillMarkerKey, true);
  } catch (error) {
    logCueMigrationError('cueMigration_backfill', { modalId }, error);
  }
};

export const persistLegacyTooltipDismissal = (legacyStorageKey: string): void => {
  SetLocalStorage(legacyStorageKey, true);
};
