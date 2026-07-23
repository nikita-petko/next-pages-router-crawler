import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { FeedbackBanner, type TFeedbackBannerSeverity } from '@rbx/foundation-ui';
import {
  CustomDashboardNotAvailableError,
  CustomDashboardPermissionDeniedError,
  CustomDashboardQuotaExceededError,
  CustomDashboardStorageUnreadableError,
  CustomDashboardUnauthenticatedError,
  CustomDashboardValidationError,
  CustomDashboardVersionConflictError,
} from '../../../errors';
import { useManagePageTranslations } from '../useManagePageTranslations';

const NOOP_CLEAR_WRITE_ERROR = (): void => undefined;

/**
 * Storage-failure banner stack mounted above the manage-page content. Read
 * causes (migration-failed, storage-unreadable, storage-not-available) fire
 * once per tab session and re-fire once the cause clears; write causes
 * (quota-exceeded, write-failed) fire on every write error. See
 * `shared/storage-failure-ux.md`.
 */
type StorageFailureToastSlotProps = {
  readonly universeId: number;
  readonly migrationFailedCount: number;
  readonly listError: unknown;
  readonly writeError?: unknown;
  readonly onClearWriteError?: () => void;
};

type ReadCause = 'migrationFailed' | 'storageUnreadable' | 'notAvailable';
type WriteCause =
  | 'quotaExceeded'
  | 'permissionDenied'
  | 'unauthenticated'
  | 'notAvailable'
  | 'versionConflict'
  | 'validationFailed'
  | 'writeFailed';

const SESSION_STORAGE_KEY = 'creator-hub:custom-dashboards:storage-failure-dismissals:v1';

type DismissalMap = Record<string, true>;

const READ_CAUSES = new Set<ReadCause>(['migrationFailed', 'storageUnreadable', 'notAvailable']);

function isReadCause(value: string): value is ReadCause {
  return (READ_CAUSES as ReadonlySet<string>).has(value);
}

function parseDismissalMap(parsed: unknown): DismissalMap {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {};
  }
  const map: DismissalMap = {};
  Object.entries(parsed).forEach(([key, value]) => {
    if (value === true) {
      map[key] = true;
    }
  });
  return map;
}

function readDismissals(): DismissalMap {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = window.sessionStorage?.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    return parseDismissalMap(parsed);
  } catch {
    return {};
  }
}

function writeDismissals(value: DismissalMap): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.sessionStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // sessionStorage unavailable (private mode); useState carries the value
    // for this tab session.
  }
}

function dismissalKey(universeId: number, cause: ReadCause): string {
  return `${universeId}:${cause}`;
}

function classifyWriteError(error: unknown): WriteCause | null {
  if (error == null) {
    return null;
  }
  if (error instanceof CustomDashboardQuotaExceededError) {
    return 'quotaExceeded';
  }
  if (error instanceof CustomDashboardPermissionDeniedError) {
    return 'permissionDenied';
  }
  if (error instanceof CustomDashboardUnauthenticatedError) {
    return 'unauthenticated';
  }
  if (error instanceof CustomDashboardNotAvailableError) {
    return 'notAvailable';
  }
  if (error instanceof CustomDashboardVersionConflictError) {
    return 'versionConflict';
  }
  if (error instanceof CustomDashboardValidationError) {
    return 'validationFailed';
  }
  return 'writeFailed';
}

// Warning = recoverable via a known remedy. Error = no in-product remedy.
const READ_CAUSE_SEVERITY: Record<ReadCause, TFeedbackBannerSeverity> = {
  migrationFailed: 'Warning',
  storageUnreadable: 'Error',
  notAvailable: 'Error',
};

const WRITE_CAUSE_SEVERITY: Record<WriteCause, TFeedbackBannerSeverity> = {
  quotaExceeded: 'Warning',
  permissionDenied: 'Error',
  unauthenticated: 'Warning',
  notAvailable: 'Error',
  versionConflict: 'Warning',
  validationFailed: 'Warning',
  writeFailed: 'Error',
};

// Plural-aware substitution; replace once ICU plural keys are registered.
function formatMigrationFailedMessage(
  count: number,
  t: ReturnType<typeof useManagePageTranslations>,
): string {
  if (count === 1) {
    return t.storageNoticeMigrationFailedSingular;
  }
  return t.storageNoticeMigrationFailedPlural({ count: String(count) });
}

function readCauseMessage(
  cause: ReadCause,
  migrationFailedCount: number,
  t: ReturnType<typeof useManagePageTranslations>,
): string {
  if (cause === 'migrationFailed') {
    return formatMigrationFailedMessage(migrationFailedCount, t);
  }
  return t.storageNoticeUnavailable;
}

function writeCauseMessage(
  cause: WriteCause,
  t: ReturnType<typeof useManagePageTranslations>,
): string {
  switch (cause) {
    case 'quotaExceeded':
      return t.storageNoticeQuotaExceeded;
    case 'permissionDenied':
      return t.storageNoticePermissionDenied;
    case 'unauthenticated':
      return t.storageNoticeUnauthenticated;
    case 'notAvailable':
      return t.storageNoticeUnavailable;
    case 'versionConflict':
      return t.storageNoticeVersionConflict;
    case 'validationFailed':
      return t.storageNoticeValidationFailed;
    case 'writeFailed':
      return t.storageNoticeWriteFailed;
  }
  return t.storageNoticeWriteFailed;
}

// Notices render as `FeedbackBanner` (in-flow, dismiss-on-action) rather than
// `Snackbar` (corner, auto-dismiss) per `shared/storage-failure-ux.md`.
const StorageFailureToastSlot: FC<StorageFailureToastSlotProps> = ({
  universeId,
  migrationFailedCount,
  listError,
  writeError,
  onClearWriteError,
}) => {
  const t = useManagePageTranslations();

  const activeReadCauses = useMemo<ReadonlyArray<ReadCause>>(() => {
    const causes: ReadCause[] = [];
    if (migrationFailedCount > 0) {
      causes.push('migrationFailed');
    }
    // notAvailable short-circuits the other read causes.
    if (listError instanceof CustomDashboardNotAvailableError) {
      causes.push('notAvailable');
    } else if (listError instanceof CustomDashboardStorageUnreadableError) {
      causes.push('storageUnreadable');
    }
    return causes;
  }, [migrationFailedCount, listError]);

  const [dismissals, setDismissals] = useState<DismissalMap>(() => readDismissals());

  // Release dismissal flags for causes no longer active so re-occurrences
  // re-fire (UX U1).
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDismissals((prev) => {
        const next: DismissalMap = { ...prev };
        let mutated = false;
        Object.keys(next).forEach((key) => {
          const colonIndex = key.indexOf(':');
          if (colonIndex < 0) {
            return;
          }
          const storedUniverse = key.slice(0, colonIndex);
          const storedCause = key.slice(colonIndex + 1);
          if (Number.parseInt(storedUniverse, 10) !== universeId) {
            return;
          }
          if (!isReadCause(storedCause) || !activeReadCauses.includes(storedCause)) {
            delete next[key];
            mutated = true;
          }
        });
        if (!mutated) {
          return prev;
        }
        writeDismissals(next);
        return next;
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeReadCauses, universeId]);

  const dismissReadCause = useCallback(
    (cause: ReadCause) => {
      setDismissals((prev) => {
        const next: DismissalMap = { ...prev, [dismissalKey(universeId, cause)]: true };
        writeDismissals(next);
        return next;
      });
    },
    [universeId],
  );

  const visibleReadCauses = activeReadCauses.filter(
    (cause) => !dismissals[dismissalKey(universeId, cause)],
  );

  const writeCause = classifyWriteError(writeError);

  if (visibleReadCauses.length === 0 && writeCause === null) {
    return null;
  }

  // FeedbackBanner sets role='alert' for Warning/Error itself.
  return (
    <div className='flex flex-col gap-xsmall'>
      {writeCause !== null ? (
        // Write notices are higher priority than read notices ("did my click go through?").
        <FeedbackBanner
          layout='Stacked'
          variant='Standard'
          severity={WRITE_CAUSE_SEVERITY[writeCause]}
          title={writeCauseMessage(writeCause, t)}
          dismissIconAriaLabel={t.storageNoticeDismissLabel}
          onDismiss={onClearWriteError ?? NOOP_CLEAR_WRITE_ERROR}
        />
      ) : null}
      {visibleReadCauses.map((cause) => (
        <FeedbackBanner
          key={cause}
          layout='Stacked'
          variant='Standard'
          severity={READ_CAUSE_SEVERITY[cause]}
          title={readCauseMessage(cause, migrationFailedCount, t)}
          dismissIconAriaLabel={t.storageNoticeDismissLabel}
          onDismiss={() => dismissReadCause(cause)}
        />
      ))}
    </div>
  );
};

export default StorageFailureToastSlot;
