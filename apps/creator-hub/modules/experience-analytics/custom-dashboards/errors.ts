/**
 * Typed errors thrown by `CustomDashboardService` implementations. UI branches
 * on `code` (never on `message`); `message` is developer-facing only. Keep
 * defaults backend-neutral unless the subclass itself is implementation-specific
 * (for example, `STORAGE_UNREADABLE` from the local-storage adapter).
 *
 * Each subclass sets `name` from `this.constructor.name` via the base
 * constructor — adding a new error subclass means one `extends` line plus a
 * `super(...)` call, no per-class `this.name = '...'` boilerplate to keep in
 * sync. The runtime stack trace and serialised error.toString still report
 * the actual subclass name correctly.
 */

export type CustomDashboardErrorCode =
  | 'NOT_FOUND'
  | 'VERSION_CONFLICT'
  | 'VALIDATION'
  | 'QUOTA_EXCEEDED'
  | 'PERMISSION_DENIED'
  | 'UNAUTHENTICATED'
  | 'NOT_AVAILABLE'
  | 'UNSUPPORTED_NEWER_SCHEMA'
  | 'MIGRATION_GAP'
  | 'STORAGE_UNREADABLE'
  | 'STORAGE_WRITE_FAILED';

export class CustomDashboardServiceError extends Error {
  readonly code: CustomDashboardErrorCode;

  constructor(code: CustomDashboardErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    // `this.constructor.name` resolves to the actual subclass at runtime, so
    // every subclass below inherits the right `name` without restating it.
    this.name = new.target.name;
    this.code = code;
  }
}

export class CustomDashboardNotFoundError extends CustomDashboardServiceError {
  readonly dashboardId: string;

  constructor(dashboardId: string) {
    super('NOT_FOUND', `Custom dashboard ${dashboardId} was not found.`);
    this.dashboardId = dashboardId;
  }
}

/** Stale `expectedVersion` on `update()` (concurrent writer elsewhere). */
export class CustomDashboardVersionConflictError extends CustomDashboardServiceError {
  readonly dashboardId: string;

  constructor(dashboardId: string) {
    super(
      'VERSION_CONFLICT',
      `Custom dashboard ${dashboardId} has been modified elsewhere. Reload to continue.`,
    );
    this.dashboardId = dashboardId;
  }
}

export class CustomDashboardValidationError extends CustomDashboardServiceError {
  readonly field: string;

  constructor(field: string, message: string) {
    super('VALIDATION', message);
    this.field = field;
  }
}

export class CustomDashboardQuotaExceededError extends CustomDashboardServiceError {
  constructor(message?: string) {
    super(
      'QUOTA_EXCEEDED',
      message ?? 'Custom dashboard quota has been exceeded. Delete a dashboard and try again.',
    );
  }
}

export class CustomDashboardPermissionDeniedError extends CustomDashboardServiceError {
  constructor(message?: string) {
    super('PERMISSION_DENIED', message ?? 'You do not have permission to modify this dashboard.');
  }
}

export class CustomDashboardUnauthenticatedError extends CustomDashboardServiceError {
  constructor(message?: string) {
    super('UNAUTHENTICATED', message ?? 'Sign in to continue using custom dashboards.');
  }
}

/** Service implementation is unavailable in this runtime or environment. */
export class CustomDashboardNotAvailableError extends CustomDashboardServiceError {
  constructor() {
    super('NOT_AVAILABLE', 'Custom dashboards are not available in this context.');
  }
}

/** On-disk schemaVersion exceeds the client's; signals a downgrade situation. */
export class CustomDashboardUnsupportedSchemaError extends CustomDashboardServiceError {
  readonly schemaVersion: number;

  readonly currentVersion: number;

  constructor(schemaVersion: number, currentVersion: number) {
    super(
      'UNSUPPORTED_NEWER_SCHEMA',
      `Stored custom dashboard schema v${schemaVersion} is newer than the client's v${currentVersion}.`,
    );
    this.schemaVersion = schemaVersion;
    this.currentVersion = currentVersion;
  }
}

/**
 * The migration registry is missing a step (or doesn't converge) for a doc at
 * `fromVersion`. Distinct from `UNSUPPORTED_NEWER_SCHEMA` (which means the doc
 * is from the future) so the UI can show a different message — typically a
 * dev-only "registry misconfigured" path rather than a user-actionable one.
 */
export class CustomDashboardMigrationGapError extends CustomDashboardServiceError {
  readonly fromVersion: number;

  readonly currentVersion: number;

  constructor(fromVersion: number, currentVersion: number, detail?: string) {
    super(
      'MIGRATION_GAP',
      detail ??
        `No migration step registered for schema version ${fromVersion} → ${currentVersion}.`,
    );
    this.fromVersion = fromVersion;
    this.currentVersion = currentVersion;
  }
}

/** Top-level bucket failed `JSON.parse`; raw bytes preserved at `sidecarKey`. */
export class CustomDashboardStorageUnreadableError extends CustomDashboardServiceError {
  readonly sidecarKey: string;

  constructor(sidecarKey: string, cause?: unknown) {
    super(
      'STORAGE_UNREADABLE',
      `Custom dashboard storage is unreadable; raw bytes preserved at "${sidecarKey}".`,
      cause !== undefined ? { cause } : undefined,
    );
    this.sidecarKey = sidecarKey;
  }
}

/**
 * `setItem` failed with something other than a quota error (Safari private
 * mode, security restrictions, unknown DOM exceptions). Distinct so callers
 * can surface a different error UX from "quota full".
 */
export class CustomDashboardStorageWriteError extends CustomDashboardServiceError {
  constructor(cause?: unknown) {
    super(
      'STORAGE_WRITE_FAILED',
      'Failed to write custom dashboard storage.',
      cause !== undefined ? { cause } : undefined,
    );
  }
}
