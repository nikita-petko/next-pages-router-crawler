export function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return formatUnknownValue(error);
}

export function formatUnknownValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint' ||
    typeof value === 'symbol' ||
    value === undefined
  ) {
    return String(value);
  }
  if (value === null) {
    return 'null';
  }
  return '[object]';
}
