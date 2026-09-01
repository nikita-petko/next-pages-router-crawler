import type { ValidConfigEntryDetail } from '../api/validTypes';
import { configEntryToKey } from './configEntryAccessors';

export const deriveLockedConfigKeysFromExperiments = (
  experiments: ReadonlyArray<{ configKey: string }>,
): Set<string> => {
  const lockedConfigKeys = new Set<string>();
  for (const experiment of experiments) {
    if (experiment.configKey) {
      lockedConfigKeys.add(experiment.configKey);
    }
  }
  return lockedConfigKeys;
};

export const deriveLockedConditionKeysFromConfigEntries = (
  lockedConfigKeys: ReadonlySet<string>,
  configEntries: ReadonlyArray<ValidConfigEntryDetail>,
): Set<string> => {
  const lockedConditionKeys = new Set<string>();
  for (const configEntry of configEntries) {
    const configKey = configEntryToKey(configEntry);
    if (!lockedConfigKeys.has(configKey)) {
      continue;
    }
    const { entry } = configEntry.overrideEntry;
    if (!entry.entryValue) {
      continue;
    }
    entry.conditionValue?.forEach((_value, conditionName) => {
      lockedConditionKeys.add(conditionName);
    });
  }
  return lockedConditionKeys;
};
