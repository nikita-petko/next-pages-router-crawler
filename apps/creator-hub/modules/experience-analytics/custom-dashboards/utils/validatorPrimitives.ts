import {
  ComparisonOffset,
  type TComparisonOffset,
} from '@modules/experience-analytics-shared/constants/comparisonOffset';
import { CustomDashboardValidationError } from '../errors';
import type { ChartOverlays } from '../types';

/**
 * Low-level coercion / narrowing primitives shared by every domain validator.
 * Each throws a `CustomDashboardValidationError` (rather than returning a
 * result type) so callers can compose them with plain assignments.
 */

const ISO_UTC_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

/**
 * Type predicate for "looks like a JSON object". Excludes arrays and `null`
 * (both of which satisfy `typeof === 'object'`). Used as the entry guard for
 * any validator that destructures untrusted input — once it returns true, the
 * value is narrowed to `Record<string, unknown>` and downstream code can
 * read fields without further casts.
 *
 * Exported so reverse adapters (which need to type-narrow JSON-decoded
 * fragments before forwarding into validators) can share the same predicate
 * instead of re-implementing the same narrowing inline.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asRecord(value: unknown, field: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new CustomDashboardValidationError(field, `${field} must be an object.`);
  }
  return value;
}

export function asString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new CustomDashboardValidationError(field, `${field} must be a string.`);
  }
  return value;
}

export function asNonEmptyString(value: unknown, field: string): string {
  const str = asString(value, field);
  if (str.length === 0) {
    throw new CustomDashboardValidationError(field, `${field} must be non-empty.`);
  }
  return str;
}

export function asNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new CustomDashboardValidationError(field, `${field} must be a finite number.`);
  }
  return value;
}

export function asOptionalFiniteNumber(value: unknown, field: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  return asNumber(value, field);
}

function isComparisonOffset(value: unknown): value is TComparisonOffset {
  return typeof value === 'string' && ComparisonOffset.some((offset) => offset === value);
}

export function validateOptionalComparisonOffset(
  value: unknown,
  field: string,
): TComparisonOffset | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (isComparisonOffset(value)) {
    return value;
  }
  throw new CustomDashboardValidationError(field, `${field} must be a valid comparison offset.`);
}

export function validatePreviousPeriodOverlay(
  value: unknown,
  field: string,
): ChartOverlays['previousPeriod'] {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === undefined) {
    return undefined;
  }
  const record = asRecord(value, field);
  return {
    relativeOffset: validateOptionalComparisonOffset(
      record.relativeOffset,
      `${field}.relativeOffset`,
    ),
    customStartTimeMs: asOptionalFiniteNumber(
      record.customStartTimeMs,
      `${field}.customStartTimeMs`,
    ),
  };
}

export function asBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new CustomDashboardValidationError(field, `${field} must be a boolean.`);
  }
  return value;
}

export function asIsoTimestamp(value: unknown, field: string): string {
  const str = asString(value, field);
  const ms = Date.parse(str);
  if (!ISO_UTC_TIMESTAMP_PATTERN.test(str) || !Number.isFinite(ms)) {
    throw new CustomDashboardValidationError(field, `${field} must be an ISO-8601 timestamp.`);
  }
  return str;
}

/**
 * Lift a strict validator into an optional one. Returns `undefined` when the
 * input is absent (`undefined` or `null`), otherwise delegates to `validate`.
 *
 * Replaces the per-call `value === undefined || value === null ? undefined :
 * validate(value, field)` pattern that used to recur in every validator with
 * an optional field — same semantics, less noise, single point to evolve if
 * we ever need to distinguish "missing" from "explicit null".
 */
export function optional<T>(
  validate: (value: unknown, field: string) => T,
): (value: unknown, field: string) => T | undefined {
  return (value, field) => {
    let result: T | undefined;
    if (value !== undefined && value !== null) {
      result = validate(value, field);
    }
    return result;
  };
}

export const asOptionalIsoTimestamp = optional(asIsoTimestamp);
export const asOptionalNonEmptyString = optional(asNonEmptyString);
/**
 * Optional boolean overlay flag. Absent/null is allowed, but a present
 * non-boolean is a corrupt persisted value and rejected rather than silently
 * coerced away (matches the strictness of the other field validators).
 */
export const validateOptionalBoolean = optional(asBoolean);

export function trimmed(value: string): string {
  return value.trim();
}
