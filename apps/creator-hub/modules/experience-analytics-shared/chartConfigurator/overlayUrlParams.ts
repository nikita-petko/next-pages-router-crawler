import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { BenchmarkType } from '../constants/BenchmarkType';
import { ComparisonOffset } from '../constants/comparisonOffset';
import type { BenchmarkOverlayType } from '../hooks/useAnalyticsBenchmarks';
import type { ComparisonOverlay, OverlayType } from '../types/RAQIV2ChartSpec';

const VALID_OVERLAY_TYPES: readonly OverlayType[] = ['benchmark', 'comparison', 'quota'] as const;

/**
 * Deserialize the `overlays` query param into an overlay discriminant string.
 *
 * - `undefined`/`null` → `undefined` (no URL state, use default behavior)
 * - empty string → `'none'` (user explicitly chose no overlay)
 * - valid type string → the discriminant (e.g. `'benchmark'`)
 *
 * Currently only one overlay type is deserialized (single-select UI).
 * When multi-select is added, this should return an array instead.
 */
export const deserializeOverlayParam = (
  param: string | string[] | undefined | null,
): OverlayType | 'none' | undefined => {
  if (param === undefined || param === null) {
    return undefined;
  }
  const raw = Array.isArray(param) ? param[0] : param;
  if (!raw) {
    return 'none';
  }
  if (isValidArrayEnumValue(VALID_OVERLAY_TYPES, raw)) {
    return raw;
  }
  return 'none';
};

/**
 * Serialize an overlay discriminant to the URL query param value.
 *
 * - `'none'` / `undefined` → `''` (empty string: explicitly no overlay)
 * - valid type → the discriminant string (e.g. `'benchmark'`)
 */
export const serializeOverlayParam = (type: OverlayType | 'none' | undefined): string => {
  if (!type || type === 'none') {
    return '';
  }
  return type;
};

const VALID_BENCHMARK_OVERLAY_TYPES: readonly BenchmarkOverlayType[] = [
  BenchmarkType.Genre,
  BenchmarkType.Similarity,
] as const;

export const deserializeBenchmarkType = (
  param: string | string[] | undefined | null,
): BenchmarkOverlayType | null => {
  const raw = Array.isArray(param) ? param[0] : param;
  if (raw && isValidArrayEnumValue(VALID_BENCHMARK_OVERLAY_TYPES, raw)) {
    return raw;
  }
  return null;
};

export const serializeBenchmarkType = (type: BenchmarkType | null): string | null => {
  return type ?? null;
};

export type ComparisonOffsetValue = ComparisonOverlay['relativeOffset'];
export type ComparisonCustomStartDateValue = ComparisonOverlay['customStartDate'];

export const deserializeComparisonOffset = (
  param: string | string[] | undefined | null,
): ComparisonOffsetValue => {
  const raw = Array.isArray(param) ? param[0] : param;
  if (raw && isValidArrayEnumValue(ComparisonOffset, raw)) {
    return raw;
  }
  return undefined;
};

export const serializeComparisonOffset = (offset: ComparisonOffsetValue): string | null => {
  return offset ?? null;
};

export const deserializeComparisonCustomStartDate = (
  param: string | string[] | undefined | null,
): ComparisonCustomStartDateValue => {
  const raw = Array.isArray(param) ? param[0] : param;
  if (!raw) {
    return undefined;
  }
  const asNumber = Number(raw);
  if (!Number.isFinite(asNumber)) {
    return undefined;
  }
  const parsedDate = new Date(asNumber);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

export const serializeComparisonCustomStartDate = (
  customStartDate: ComparisonCustomStartDateValue,
): string | null => {
  return customStartDate ? customStartDate.getTime().toString() : null;
};
