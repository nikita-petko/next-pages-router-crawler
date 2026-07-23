/**
 * Custom-dashboard schema migrations. Steps are pure, idempotent transforms
 * from `fromVersion` → `toVersion`, applied on read.
 *
 * The registry currently holds a single identity step (`0 → 1`) that backs
 * the v0.1 alpha contract: pre-version-field records, hand-edited JSON, and
 * already-v1-shaped docs are accepted as-is. Once we ship a real v2, that
 * step joins the chain and the version constant in `types.ts` advances.
 *
 * Pre-launch breaking shape changes are still expected to invalidate local
 * records rather than land as steps (see `tech-spec.md` §6.3) — but that
 * "invalidate" path lives in the storage adapter (catch + quarantine), not
 * here. Engine-level special cases would muddy the contract.
 */

import { CustomDashboardMigrationGapError, CustomDashboardUnsupportedSchemaError } from './errors';
import { CUSTOM_DASHBOARD_CURRENT_SCHEMA_VERSION, type UnknownPersistedDocument } from './types';

export type MigrationStep = {
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly description: string;
  readonly migrate: (doc: UnknownPersistedDocument) => UnknownPersistedDocument;
};

/**
 * Identity hatch from missing/zero `schemaVersion` to the v1 alpha shape.
 * Registered as a real step (rather than a special-case branch in
 * `runMigrations`) so the engine can stay a pure "find step, apply, advance"
 * loop. When v2 lands, this step stays — the chain becomes `0 → 1 → 2` and
 * the engine code is unchanged.
 */
const v0ToV1IdentityStep: MigrationStep = {
  fromVersion: 0,
  toVersion: 1,
  description: 'v0 → v1 identity: alpha records had no schemaVersion field but were v1-shaped.',
  migrate: (doc) => doc,
};

export const migrationRegistry: ReadonlyArray<MigrationStep> = [v0ToV1IdentityStep];

/**
 * Engine guts, parameterised over the registry and target version. Exported
 * so tests can pin engine semantics against injected fake chains without
 * mutating the module-scoped registry.
 *
 * Asserts that each step's output `schemaVersion` matches its declared
 * `toVersion` — a misregistered step would otherwise silently produce a
 * document with the wrong stamped version, deferring the failure to a
 * downstream validator.
 */
export function runMigrations(
  raw: UnknownPersistedDocument,
  registry: ReadonlyArray<MigrationStep>,
  targetVersion: number,
): UnknownPersistedDocument & { schemaVersion: number } {
  let current: UnknownPersistedDocument = { ...raw };
  const rawVersion = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;

  if (rawVersion > targetVersion) {
    throw new CustomDashboardUnsupportedSchemaError(rawVersion, targetVersion);
  }

  let version = rawVersion;

  // Bound the loop so a misregistered step that loops back on itself can't
  // hang the read path. `registry.length + 1` is the tightest safe ceiling:
  // any well-formed chain converges in at most `registry.length` steps, and
  // the `+ 1` lets the post-loop `version !== targetVersion` check throw a
  // descriptive `MIGRATION_GAP` instead of failing silently at the boundary.
  const maxSteps = registry.length + 1;
  let steps = 0;
  while (version < targetVersion && steps < maxSteps) {
    const sourceVersion = version;
    const step = registry.find((s) => s.fromVersion === sourceVersion);
    if (!step) {
      throw new CustomDashboardMigrationGapError(sourceVersion, targetVersion);
    }
    const migrated = step.migrate(current);
    // Engine stamps `schemaVersion` after each step, so steps don't have to
    // touch it. But if a step *does* set it, the value must agree with the
    // chain — either left at `sourceVersion` (the engine will advance it) or
    // explicitly stamped at `step.toVersion`. Anything else means the step
    // is misregistered: declared `fromVersion`/`toVersion` disagrees with
    // what the migration actually produces, and the doc would walk further
    // along the chain with a contradictory version stamp.
    const produced = migrated.schemaVersion;
    if (typeof produced === 'number' && produced !== sourceVersion && produced !== step.toVersion) {
      throw new CustomDashboardMigrationGapError(
        sourceVersion,
        targetVersion,
        `Migration step ${sourceVersion} → ${step.toVersion} produced schemaVersion ${produced}.`,
      );
    }
    current = { ...migrated, schemaVersion: step.toVersion };
    version = step.toVersion;
    steps += 1;
  }

  if (version !== targetVersion) {
    throw new CustomDashboardMigrationGapError(
      version,
      targetVersion,
      `Migration pipeline did not converge after ${steps} steps (stopped at version ${version}).`,
    );
  }

  return { ...current, schemaVersion: targetVersion };
}

/**
 * Apply every registered migration in order. Missing `schemaVersion` is
 * treated as `0`. Throws a typed error when the chain can't converge so the
 * caller can quarantine the record (and the UI can show a code-specific
 * message) rather than rendering stale data.
 */
export function applyMigrations(
  raw: UnknownPersistedDocument,
): UnknownPersistedDocument & { schemaVersion: number } {
  return runMigrations(raw, migrationRegistry, CUSTOM_DASHBOARD_CURRENT_SCHEMA_VERSION);
}
