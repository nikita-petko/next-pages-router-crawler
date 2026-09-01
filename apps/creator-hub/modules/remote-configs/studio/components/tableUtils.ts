import { ValidConfigEntryValueType } from '../../api/universeConfigsClientEnums';
import type { ValidConfigEntryValue } from '../../api/validTypes';

export const configEntryToStringTypeValue = (entryValue: ValidConfigEntryValue) => {
  switch (entryValue.valueType) {
    case ValidConfigEntryValueType.String:
      return 'String';
    case ValidConfigEntryValueType.Number:
      return 'Number';
    case ValidConfigEntryValueType.Boolean:
      return 'Boolean';
    case ValidConfigEntryValueType.Json:
      return 'JSON';
    default: {
      const exhaustiveCheck: never = entryValue;
      throw new Error(`Unhandled value type: ${exhaustiveCheck}`);
    }
  }
};

export type StringOrNumberConfigEntryValue = ValidConfigEntryValue & {
  valueType: ValidConfigEntryValueType.String | ValidConfigEntryValueType.Number;
};
export const configEntryToStringValueForStagedTableEditableCell = (
  entryValue: StringOrNumberConfigEntryValue,
) => {
  switch (entryValue.valueType) {
    case ValidConfigEntryValueType.String:
      return entryValue.stringValue;
    case ValidConfigEntryValueType.Number:
      return entryValue.numberValue.toString();
    default: {
      const exhaustiveCheck: never = entryValue;
      throw new Error(`Unhandled value type: ${exhaustiveCheck}`);
    }
  }
};
