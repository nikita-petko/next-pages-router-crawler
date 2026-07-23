import type { CreatorConfigsPublicApiDeploymentStrategy } from '@modules/clients/creatorConfigsPublicApi';
import { DeploymentStrategy, ValidConfigEntryValueType } from '../api/universeConfigsClientEnums';
import type { ValidConfigEntryDetail, ValidConfigEntryValue } from '../api/validTypes';

/**
 * Convert a discriminated `ValidConfigEntryValue` into the raw JS value that
 * the public CreatorConfigs API expects in its `entries` map.
 */
export const entryValueToRaw = (v: ValidConfigEntryValue): unknown => {
  switch (v.valueType) {
    case ValidConfigEntryValueType.String:
      return v.stringValue;
    case ValidConfigEntryValueType.Boolean:
      return v.boolValue;
    case ValidConfigEntryValueType.Number:
      return v.numberValue;
    case ValidConfigEntryValueType.Json:
      return JSON.parse(v.jsonValue);
    default: {
      const exhaustive: never = v;
      throw new Error(`Unhandled value type: ${JSON.stringify(exhaustive)}`);
    }
  }
};

/**
 * Build the `entries` payload for the public API's
 * `overwriteDraft`/`updateDraft` calls from a list of internal
 * `ValidConfigEntryDetail`s. Deleted entries (tombstones) are skipped.
 */
export const detailsToOverwriteEntries = (
  details: ValidConfigEntryDetail[],
): Record<string, unknown> => {
  const entries: Record<string, unknown> = {};
  for (const detail of details) {
    const { entry } = detail.overrideEntry;
    if (!('entryValue' in entry) || !entry.entryValue) {
      continue;
    }
    entries[entry.key] = entryValueToRaw(entry.entryValue);
  }
  return entries;
};

/**
 * Map the internal `DEPLOYMENT_STRATEGY_*` enum strings to the public API's short labels.
 */
export const toPublicApiDeploymentStrategy = (
  strategy: DeploymentStrategy,
): CreatorConfigsPublicApiDeploymentStrategy | undefined => {
  switch (strategy) {
    case DeploymentStrategy.Immediate:
      return 'Immediate';
    case DeploymentStrategy.GradualRollout:
      return 'GradualRollout';
    case DeploymentStrategy.Invalid:
      return undefined;
    default:
      return undefined;
  }
};
