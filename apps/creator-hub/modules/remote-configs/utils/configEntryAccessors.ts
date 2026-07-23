import { ValidConfigEntryDetail } from '../api/validTypes';

export const configEntryToKey = (configEntry: ValidConfigEntryDetail) => {
  return configEntry.overrideEntry.entry.key;
};

export const configEntryToOverrideValue = (configEntry: ValidConfigEntryDetail) => {
  return configEntry.isOverride ? configEntry.overrideEntry.entry.entryValue : undefined;
};

export const configEntryToDescription = (configEntry: ValidConfigEntryDetail) => {
  return configEntry.overrideEntry.entry.description;
};

export const configEntryToLastAccessedTimeAsString = (configEntry: ValidConfigEntryDetail) => {
  return configEntry.lastAccessedTime;
};

export const configEntryToBestEntryValue = (configEntry: ValidConfigEntryDetail) => {
  return configEntry.overrideEntry.entry.entryValue;
};
