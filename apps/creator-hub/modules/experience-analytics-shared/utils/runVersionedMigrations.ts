export type VersionedMigrationStep<TDocument> = {
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly description: string;
  readonly migrate: (document: TDocument) => TDocument;
};

export type VersionedMigrationErrorKind = 'unsupported-version' | 'migration-gap';

export class VersionedMigrationError extends Error {
  readonly kind: VersionedMigrationErrorKind;

  readonly fromVersion: number;

  readonly targetVersion: number;

  constructor(
    kind: VersionedMigrationErrorKind,
    fromVersion: number,
    targetVersion: number,
    message?: string,
  ) {
    super(
      message ??
        (kind === 'unsupported-version'
          ? `Document version ${fromVersion} is not supported; target version ${targetVersion}.`
          : `No migration path from version ${fromVersion} to version ${targetVersion}.`),
    );
    this.name = 'VersionedMigrationError';
    this.kind = kind;
    this.fromVersion = fromVersion;
    this.targetVersion = targetVersion;
  }
}

export type RunVersionedMigrationsOptions<TDocument> = {
  readonly document: TDocument;
  readonly registry: readonly VersionedMigrationStep<TDocument>[];
  readonly targetVersion: number;
  readonly getVersion: (document: TDocument) => number;
  readonly setVersion: (document: TDocument, version: number) => TDocument;
  readonly createUnsupportedVersionError?: (sourceVersion: number, targetVersion: number) => Error;
  readonly createMigrationGapError?: (
    sourceVersion: number,
    targetVersion: number,
    message?: string,
  ) => Error;
};

const defaultUnsupportedVersionError = (
  sourceVersion: number,
  targetVersion: number,
): VersionedMigrationError =>
  new VersionedMigrationError('unsupported-version', sourceVersion, targetVersion);

const defaultMigrationGapError = (
  sourceVersion: number,
  targetVersion: number,
  message?: string,
): VersionedMigrationError =>
  new VersionedMigrationError('migration-gap', sourceVersion, targetVersion, message);

/**
 * Applies versioned migration steps until a document reaches `targetVersion`.
 *
 * The engine is domain-agnostic: callers own version read/write semantics,
 * migration steps, and optional error types. Each step may either leave the
 * version unchanged or stamp its declared `toVersion`; contradictory stamps
 * fail fast so the document cannot continue through the chain mislabeled.
 */
export const runVersionedMigrations = <TDocument>({
  document,
  registry,
  targetVersion,
  getVersion,
  setVersion,
  createUnsupportedVersionError = defaultUnsupportedVersionError,
  createMigrationGapError = defaultMigrationGapError,
}: RunVersionedMigrationsOptions<TDocument>): TDocument => {
  let current = document;
  const originalVersion = getVersion(document);

  if (originalVersion > targetVersion) {
    throw createUnsupportedVersionError(originalVersion, targetVersion);
  }

  let version = originalVersion;
  const maxSteps = registry.length + 1;
  let steps = 0;

  while (version < targetVersion && steps < maxSteps) {
    const sourceVersion = version;
    const step = registry.find((candidate) => candidate.fromVersion === sourceVersion);
    if (!step) {
      throw createMigrationGapError(sourceVersion, targetVersion);
    }

    const migrated = step.migrate(current);
    const producedVersion = getVersion(migrated);
    if (producedVersion !== sourceVersion && producedVersion !== step.toVersion) {
      throw createMigrationGapError(
        sourceVersion,
        targetVersion,
        `Migration step ${sourceVersion} -> ${step.toVersion} produced version ${producedVersion}.`,
      );
    }

    current = setVersion(migrated, step.toVersion);
    version = step.toVersion;
    steps += 1;
  }

  if (version !== targetVersion) {
    throw createMigrationGapError(
      version,
      targetVersion,
      `Migration pipeline did not converge after ${steps} steps (stopped at version ${version}).`,
    );
  }

  return setVersion(current, targetVersion);
};
