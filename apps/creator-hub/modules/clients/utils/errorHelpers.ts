function extractUnknownValueFromError(obj: unknown, key: string): unknown | undefined {
  if (obj !== null && typeof obj === 'object' && key in obj) {
    return obj[key as keyof typeof obj];
  }

  return undefined;
}

export function extractStringValueFromError<T extends string | undefined>(
  obj: unknown,
  key: string,
  defaultValue?: T,
) {
  const unknownValue = extractUnknownValueFromError(obj, key);
  if (typeof unknownValue === 'string') {
    return unknownValue;
  }

  return defaultValue as T extends string ? string : string | undefined;
}

function extractNumericValueFromError<T extends number | undefined>(
  obj: unknown,
  key: string,
  defaultValue?: T,
) {
  const unknownValue = extractUnknownValueFromError(obj, key);
  if (typeof unknownValue === 'number') {
    return unknownValue;
  }

  return defaultValue as T extends number ? number : number | undefined;
}

// Returns status code from a thrown Response
export function getErrorStatus<T extends number | undefined>(error: unknown, defaultStatus?: T) {
  return extractNumericValueFromError(error, 'status', defaultStatus);
}

// Get's the error code from thrown GenericBEDEV1Error
export function getErrorCode<T extends number | undefined>(error: unknown, defaultCode?: T) {
  return extractNumericValueFromError(error, 'code', defaultCode);
}
