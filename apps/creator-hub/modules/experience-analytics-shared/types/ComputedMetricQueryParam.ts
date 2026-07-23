import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate';
import type { RAQIV2QueryFilter } from '@modules/clients/analytics';
import { RAQIV2FilterOperation } from '@modules/clients/analytics';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import {
  RAQIV2AggregationType,
  RAQIV2Dimension,
  RAQIV2PercentileType,
  RAQIV2UIPseudoDimension,
  RAQIV2Metric,
} from '@rbx/creator-hub-analytics-config';
import {
  isNumericUIMetric,
  type TRAQIV2NumericUIMetric,
} from '../constants/AnalyticsMetricDisplayConfig';
import type { ComputedMetric, ComputedMetricSource } from './ComputedMetric';

/**
 * Compact URL payload for computed metrics.
 *
 * Shape:
 * - s: sources -> [variableKey, metric, optionalFilters]
 * - f: formula text
 * - n: optional display name
 * - l: optional l7 smoothing marker (1 = enabled)
 */
type CompactComputedMetricSourceEntry =
  | [string, TRAQIV2NumericUIMetric]
  | [string, TRAQIV2NumericUIMetric, RAQIV2QueryFilter[] | null];

type CompactComputedMetricQueryParam = {
  s: CompactComputedMetricSourceEntry[];
  f: string;
  n?: string;
  l?: 1;
};
const MaxComputedMetricQueryParamLength = 4_096;
const MaxDecompressedComputedMetricPayloadLength = 4_096;
const CompressedComputedMetricQueryParamPrefix = 'cm1.';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isNumericSourceMetric = (value: unknown): value is TRAQIV2NumericUIMetric =>
  isNonEmptyString(value) && isValidEnumValue(RAQIV2Metric, value) && isNumericUIMetric(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');

const isEnumPrimitive = (value: unknown): value is string | number =>
  typeof value === 'string' || typeof value === 'number';

const isValidFilterOperation = (
  value: unknown,
): value is Exclude<RAQIV2FilterOperation, typeof RAQIV2FilterOperation.Invalid> =>
  isEnumPrimitive(value) &&
  isValidEnumValue(RAQIV2FilterOperation, value) &&
  value !== RAQIV2FilterOperation.Invalid;

const isValidComputedMetricSourceFilter = (value: unknown): value is RAQIV2QueryFilter => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const filter = value as {
    dimension?: unknown;
    values?: unknown;
    operation?: unknown;
  };
  const { dimension, values, operation } = filter;
  if (dimension === RAQIV2UIPseudoDimension.PercentileType) {
    return (
      Array.isArray(values) &&
      values.every((entry) => isValidEnumValue(RAQIV2PercentileType, entry)) &&
      operation === undefined
    );
  }
  if (dimension === RAQIV2UIPseudoDimension.AggregationType) {
    return (
      Array.isArray(values) &&
      values.every((entry) => isValidEnumValue(RAQIV2AggregationType, entry)) &&
      operation === undefined
    );
  }
  if (!isEnumPrimitive(dimension) || !isValidEnumValue(RAQIV2Dimension, dimension)) {
    return false;
  }
  return isStringArray(values) && (operation === undefined || isValidFilterOperation(operation));
};

const areValidComputedMetricSourceFilters = (
  value: unknown,
): value is readonly RAQIV2QueryFilter[] =>
  Array.isArray(value) && value.every((entry) => isValidComputedMetricSourceFilter(entry));

const isCompactComputedMetricSourceEntry = (
  entry: unknown,
): entry is CompactComputedMetricSourceEntry => {
  if (!Array.isArray(entry) || entry.length < 2 || entry.length > 3) {
    return false;
  }
  const [key, sourceMetric, filters] = entry;
  return (
    isNonEmptyString(key) &&
    isNumericSourceMetric(sourceMetric) &&
    (filters === undefined || filters === null || areValidComputedMetricSourceFilters(filters))
  );
};

const isCompactComputedMetricQueryParam = (
  value: unknown,
): value is CompactComputedMetricQueryParam => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<CompactComputedMetricQueryParam>;
  if (!Array.isArray(candidate.s) || candidate.s.length === 0 || !isNonEmptyString(candidate.f)) {
    return false;
  }
  if (!(candidate.n === undefined || typeof candidate.n === 'string')) {
    return false;
  }
  return candidate.s.every((entry) => isCompactComputedMetricSourceEntry(entry));
};

// Parse untrusted query payloads as unknown and require explicit runtime validation.
const safeParseJson = (value: string): unknown | null => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const encodeToBase64Url = (bytes: Uint8Array): string => {
  let binary = '';
  const chunkSize = 0x8000;
  for (let idx = 0; idx < bytes.length; idx += chunkSize) {
    const chunk = bytes.subarray(idx, idx + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/u, '');
};

const decodeFromBase64Url = (value: string): Uint8Array | null => {
  if (!isNonEmptyString(value) || !/^[A-Za-z0-9_-]+$/u.test(value)) {
    return null;
  }
  const base64 = value.replace(/-/gu, '+').replace(/_/gu, '/');
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
  try {
    if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(padded, 'base64'));
    }
    const binary = atob(padded);
    const output = new Uint8Array(binary.length);
    for (let idx = 0; idx < binary.length; idx += 1) {
      output[idx] = binary.charCodeAt(idx);
    }
    return output;
  } catch {
    return null;
  }
};

const compressComputedMetricPayload = (payload: string): string => {
  return encodeToBase64Url(deflateSync(strToU8(payload)));
};

const decompressComputedMetricPayload = (payload: string): string | null => {
  const decodedBytes = decodeFromBase64Url(payload);
  if (!decodedBytes) {
    return null;
  }
  try {
    const decompressedPayload = strFromU8(inflateSync(decodedBytes));
    if (decompressedPayload.length > MaxDecompressedComputedMetricPayloadLength) {
      return null;
    }
    return decompressedPayload;
  } catch {
    return null;
  }
};

export const serializeComputedMetricToQueryParam = (
  metric: ComputedMetric<TRAQIV2NumericUIMetric>,
): string => {
  const compact: CompactComputedMetricQueryParam = {
    s: metric.sources.map((source) =>
      source.filters && source.filters.length > 0
        ? [source.key, source.metric, [...source.filters]]
        : [source.key, source.metric],
    ),
    f: metric.formula,
    n: isNonEmptyString(metric.name) ? metric.name.trim() : undefined,
    l: metric.l7Smoothing ? 1 : undefined,
  };
  return `${CompressedComputedMetricQueryParamPrefix}${compressComputedMetricPayload(
    JSON.stringify(compact),
  )}`;
};

export const deserializeComputedMetricFromQueryParam = (
  encodedValue: string | null | undefined,
): ComputedMetric<TRAQIV2NumericUIMetric> | null => {
  if (!encodedValue) {
    return null;
  }
  if (encodedValue.length > MaxComputedMetricQueryParamLength) {
    return null;
  }
  if (!encodedValue.startsWith(CompressedComputedMetricQueryParamPrefix)) {
    return null;
  }
  const compressedPayload = encodedValue.slice(CompressedComputedMetricQueryParamPrefix.length);
  const decompressedPayload = decompressComputedMetricPayload(compressedPayload);
  if (!decompressedPayload) {
    return null;
  }
  const parsed = safeParseJson(decompressedPayload);
  if (parsed === null) {
    return null;
  }

  if (!isCompactComputedMetricQueryParam(parsed)) {
    return null;
  }

  const [firstSource, ...otherSources] = parsed.s;
  const toSource = ([
    key,
    sourceMetric,
    filters,
  ]: CompactComputedMetricSourceEntry): ComputedMetricSource<TRAQIV2NumericUIMetric> => {
    return {
      key,
      metric: sourceMetric,
      filters: filters ?? undefined,
    };
  };

  const firstParsed = toSource(firstSource);
  const otherParsed: ComputedMetricSource<TRAQIV2NumericUIMetric>[] = otherSources.map(toSource);

  return {
    sources: [firstParsed, ...otherParsed],
    formula: parsed.f,
    name: isNonEmptyString(parsed.n) ? parsed.n : undefined,
    l7Smoothing: parsed.l === 1,
  };
};
