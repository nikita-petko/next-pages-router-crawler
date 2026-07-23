import CodeEditorSupportedLanguages from '@modules/charts-generic/components/CodeEditors/CodeEditorSupportedLanguages';
import { ValidConfigEntryValueType } from '../api/universeConfigsClientEnums';
import type { ValidConfigEntryValue } from '../api/validTypes';

const configEntryToStringValue = (
  entryValue: ValidConfigEntryValue | undefined,
): string | undefined => {
  if (!entryValue) {
    return undefined;
  }
  const { valueType } = entryValue;
  switch (valueType) {
    case ValidConfigEntryValueType.Boolean:
      return entryValue.boolValue ? 'True' : 'False';
    case ValidConfigEntryValueType.Number:
      return `${entryValue.numberValue}`;
    case ValidConfigEntryValueType.String:
      return `"${entryValue.stringValue}"`; // quote value for string type
    case ValidConfigEntryValueType.Json:
      return entryValue.jsonValue;
    default: {
      const exhaustiveCheck: never = valueType;
      throw new Error(`Unhandled value type: ${exhaustiveCheck}`);
    }
  }
};

const typesUseMonoSpace = [ValidConfigEntryValueType.Boolean, ValidConfigEntryValueType.Number];

type StringCellValue = {
  value: string;
  language?: CodeEditorSupportedLanguages;
  useMonoFont?: boolean;
};

export const configEntryToStringValueForTable = (
  entryValue: ValidConfigEntryValue | undefined,
): StringCellValue => {
  if (!entryValue) {
    return {
      value: '--',
    };
  }

  const stringValue = configEntryToStringValue(entryValue);
  return {
    value: stringValue || '--',
    language:
      entryValue.valueType === ValidConfigEntryValueType.Json
        ? CodeEditorSupportedLanguages.Json
        : undefined,
    useMonoFont: typesUseMonoSpace.includes(entryValue.valueType),
  };
};

export default configEntryToStringValue;
