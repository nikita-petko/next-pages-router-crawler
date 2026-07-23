import { ValidConfigEntryValueType } from '../../api/universeConfigsClientEnums';
import type { ValidConfigEntryValue } from '../../api/validTypes';

/**
 * Converts a config entry value to a string that can be used in the experiment form.
 * Different from configEntryToStringValue which is used to format values in configs table, there we:
 * Quote string values, using Capital letter on booleans (True or False)
 */
const configEntryToExperimentFormValue = (
  entryValue: ValidConfigEntryValue | undefined,
): string | undefined => {
  if (!entryValue) {
    return undefined;
  }
  const { valueType } = entryValue;

  switch (valueType) {
    case ValidConfigEntryValueType.Boolean:
      return entryValue.boolValue.toString();
    case ValidConfigEntryValueType.Number:
      return entryValue.numberValue.toString();
    case ValidConfigEntryValueType.String:
      return entryValue.stringValue;
    case ValidConfigEntryValueType.Json:
      return entryValue.jsonValue;
    default: {
      const exhaustiveCheck: never = valueType;
      throw new Error(`Unhandled value type: ${exhaustiveCheck}`);
    }
  }
};

export default configEntryToExperimentFormValue;
