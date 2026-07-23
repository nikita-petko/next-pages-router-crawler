import type { ValidConfigEntry, ValidConfigEntryValue } from '../api/validTypes';

export type ExpandedConditionValue = {
  label: string;
  value: ValidConfigEntryValue | undefined;
};

export const configEntryHasConditionValues = (entry: ValidConfigEntry | undefined): boolean => {
  return !!entry?.conditionValue?.size;
};

export const sortConditionNamesByOrder = (names: string[], conditionOrder?: string[]): string[] => {
  if (!conditionOrder?.length) {
    return names;
  }

  const orderIndexByName = new Map(conditionOrder.map((name, index) => [name, index]));
  const orderedNames: string[] = [];
  const unorderedNames: string[] = [];

  conditionOrder.forEach((name) => {
    if (names.includes(name)) {
      orderedNames.push(name);
    }
  });

  names.forEach((name) => {
    if (!orderIndexByName.has(name)) {
      unorderedNames.push(name);
    }
  });

  return [...orderedNames, ...unorderedNames];
};

export const configEntryToExpandedConditionValues = (
  entry: ValidConfigEntry,
  defaultValueLabel: string,
  defaultValue: ValidConfigEntryValue | undefined = entry.entryValue,
  conditionOrder?: string[],
): ExpandedConditionValue[] => {
  const conditionValueMap = entry.conditionValue;
  if (!conditionValueMap?.size) {
    return [];
  }

  const conditionNames = sortConditionNamesByOrder(
    Array.from(conditionValueMap.keys()),
    conditionOrder,
  );

  return [
    ...conditionNames.map((conditionName) => ({
      label: conditionName,
      value: conditionValueMap.get(conditionName),
    })),
    {
      label: defaultValueLabel,
      value: defaultValue,
    },
  ];
};
