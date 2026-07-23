export const MAX_PLACE_IDS = 1000;

export type CoresValidationErrorCode =
  | 'TOO_MANY_PLACE_IDS'
  | 'INVALID_PLACE_ID'
  | 'DUPLICATE_PLACE_ID';

export class CoresValidationError extends Error {
  code: CoresValidationErrorCode;

  constructor(code: CoresValidationErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'CoresValidationError';
    this.code = code;
    Object.setPrototypeOf(this, CoresValidationError.prototype);
  }
}

export function isValidPlaceId(value: unknown): value is number {
  if (typeof value !== 'number') {
    return false;
  }
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return false;
  }
  if (value <= 0) {
    return false;
  }
  if (value > Number.MAX_SAFE_INTEGER) {
    return false;
  }
  return true;
}

export function dedupePlaceIds(ids: ReadonlyArray<number>): number[] {
  return Array.from(new Set(ids));
}

export function buildPlaceIdToNameMap(
  places: ReadonlyArray<{ placeId: number; name: string }>,
): Map<number, string> {
  const map = new Map<number, string>();
  places.forEach((p) => map.set(p.placeId, p.name));
  return map;
}

export function assertCoresPayload(ids: ReadonlyArray<number>): void {
  if (ids.length > MAX_PLACE_IDS) {
    throw new CoresValidationError('TOO_MANY_PLACE_IDS');
  }
  if (ids.some((id) => !isValidPlaceId(id))) {
    throw new CoresValidationError('INVALID_PLACE_ID');
  }
  if (new Set(ids).size !== ids.length) {
    throw new CoresValidationError('DUPLICATE_PLACE_ID');
  }
}
