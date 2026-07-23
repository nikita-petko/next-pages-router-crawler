export type EnumType<TEnum extends string | number> = { [key in string]: TEnum };
export const getEnumKeyByValue = <TEnum extends string | number>(
  inputEnum: EnumType<TEnum>,
  code: string | number | undefined,
): string | null => {
  const result = Object.entries(inputEnum).find(([, value]) => value === code);
  if (result) {
    return result[0];
  }
  return null;
};

export const isValidEnumValue = <TEnum extends string | number>(
  obj: EnumType<TEnum>,
  input: string | number,
): input is TEnum => {
  return Object.values(obj).includes(input as TEnum);
};

/**
 * The analogous function to isValidEnumValue for array-like enums, e.g.:
 *  const Things = [1, 2, 3] as const;
 *  type TThings = typeof Things[number];
 *
 * Call with `isValidArrayEnumValue(Things, input)`
 *  (The inferred `TEnum` in this template type will be `TThings`.)
 */
export const isValidArrayEnumValue = <TEnum extends string | number>(
  options: readonly TEnum[],
  input: string | number,
): input is TEnum => {
  return options.indexOf(input as TEnum) !== -1;
};
