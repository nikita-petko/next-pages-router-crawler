import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate';
import {
  RAQIV2AggregationType,
  RAQIV2Dimension,
  RAQIV2PercentileType,
  RAQIV2UIMetric,
  type TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2UIMetricFanoutDimensionValues } from '@rbx/creator-hub-analytics-config';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import { AnalyticsQueryGatewayAPIFilterOperation as RAQIV2FilterOperation } from '@modules/clients/analytics/analyticsQueryGateway';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  isNumericUIMetric,
  type TRAQIV2NumericUIMetric,
} from '../constants/AnalyticsMetricDisplayConfig';
import isMetricFanoutDimension from '../utils/isMetricFanoutDimension';
import type {
  ComputedMetric,
  ComputedMetricSource,
  ComputedMetricSourceFilter,
} from './ComputedMetric';
import { getUIMetricFromAtomicMetricLike, isCustomEventsAtomicMetricLike } from './ComputedMetric';
import {
  LatestCompactComputedMetricPayloadVersion,
  migrateCompactComputedMetricQueryParam,
} from './ComputedMetricQueryParamMigrations';

/**
 * Compact URL payload for computed metrics.
 *
 * Top-level shape:
 * - s: sources (object-per-source; see {@link CompactComputedMetricSourceEntry})
 * - f: formula text
 * - n: optional display name
 * - l: optional l7 smoothing marker (1 = enabled)
 *
 * Versioned by the `cm2.` prefix. The previous `cm1.` format combined real
 * filters and metric-fanout pseudo-dimension selections into a single list
 * per source; reading such a URL now fails deserialization and the app
 * falls back to its default metric. This is an intentional hard cut: the
 * pre-cut format is ambiguous (no way to tell "filter by AggregationType"
 * from "select AggregationType variant"), and the UI state this URL
 * reflects is still in alpha testing.
 *
 * Per-source shape is an object (not a tuple) so future additions —
 * per-source breakdowns, post-transforms, variant filters — can land as
 * additive optional keys without another version bump. The payload includes a
 * version field for in-place `cm2.` schema migrations; missing-version `cm2.`
 * payloads are treated as compact payload v1.
 */
type CompactPseudoDimensionValues = {
  /** aggregationType */
  a?: RAQIV2AggregationType;
  /** percentile */
  p?: RAQIV2PercentileType;
};

type CompactComputedMetricSourceEntry = {
  /** key (variable name in the formula, e.g. "A") */
  k: string;
  /** metric */
  m: TRAQIV2NumericUIMetric;
  /**
   * Real filters only — fanout pseudo-dimensions (AggregationType,
   * PercentileType) and CustomEventName source identity must NOT appear
   * here. Hand-crafted payloads that try are rejected during deserialization
   * by {@link isValidComputedMetricSourceFilter}.
   */
  f?: ComputedMetricSourceFilter[];
  /** customEventName source identity */
  c?: string;
  /** fanout pseudo-dimension selections */
  p?: CompactPseudoDimensionValues;
};

type CompactComputedMetricSourceEntryV1 = Omit<CompactComputedMetricSourceEntry, 'c'> & {
  c?: string;
};

type CompactComputedMetricQueryParamV1 = {
  v?: 1;
  s: CompactComputedMetricSourceEntryV1[];
  f: string;
  n?: string;
  l?: 1;
};

type CompactComputedMetricQueryParamV2 = {
  v: 2;
  s: CompactComputedMetricSourceEntry[];
  f: string;
  n?: string;
  l?: 1;
};

type CompactComputedMetricQueryParam =
  | CompactComputedMetricQueryParamV1
  | CompactComputedMetricQueryParamV2;

const MaxComputedMetricQueryParamLength = 4_096;
const MaxDecompressedComputedMetricPayloadLength = 4_096;
const CompressedComputedMetricQueryParamPrefix = 'cm2.';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isNumericSourceMetric = (value: unknown): value is TRAQIV2NumericUIMetric =>
  isNonEmptyString(value) && isNumericUIMetric(value);

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

/**
 * Validates a real query filter for inclusion on a `ComputedMetricSource`.
 * Three carriers are explicitly rejected, mirroring the structural
 * exclusions baked into `ComputedMetricSourceFilter`:
 *  - Fanout pseudo-dimensions (`AggregationType`, `PercentileType`) — these
 *    travel on the dedicated `p` slot, not the `f` slot.
 *  - `CustomEventName` source identity — this lives on the atomic metric
 *    (`CustomEventsAtomicMetricLike.customEventName`) via the `c` slot, not
 *    as a filter. Legacy `cm1.` payloads carrying it as a filter are lifted
 *    by `migrateCompactComputedMetricQueryParam`; payloads that still
 *    smuggle it into `cm2.f` are rejected here.
 */
const isValidComputedMetricSourceFilter = (value: unknown): value is ComputedMetricSourceFilter => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const filter = value as {
    dimension?: unknown;
    values?: unknown;
    operation?: unknown;
  };
  const { dimension, values, operation } = filter;
  if (!isEnumPrimitive(dimension) || !isValidEnumValue(RAQIV2Dimension, dimension)) {
    return false;
  }
  if (isMetricFanoutDimension(dimension as TRAQIV2Dimension)) {
    return false;
  }
  if (dimension === RAQIV2Dimension.CustomEventName) {
    return false;
  }
  return isStringArray(values) && (operation === undefined || isValidFilterOperation(operation));
};

const areValidComputedMetricSourceFilters = (
  value: unknown,
): value is readonly ComputedMetricSourceFilter[] =>
  Array.isArray(value) && value.every((entry) => isValidComputedMetricSourceFilter(entry));

const isValidCompactPseudoDimensionValues = (
  value: unknown,
): value is CompactPseudoDimensionValues => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as { a?: unknown; p?: unknown };
  if (
    candidate.a !== undefined &&
    !(isEnumPrimitive(candidate.a) && isValidEnumValue(RAQIV2AggregationType, candidate.a))
  ) {
    return false;
  }
  if (
    candidate.p !== undefined &&
    !(isEnumPrimitive(candidate.p) && isValidEnumValue(RAQIV2PercentileType, candidate.p))
  ) {
    return false;
  }
  return true;
};

const isCompactComputedMetricSourceEntry = (
  entry: unknown,
): entry is CompactComputedMetricSourceEntry => {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return false;
  }
  const candidate = entry as Partial<CompactComputedMetricSourceEntry>;
  if (!isNonEmptyString(candidate.k) || !isNumericSourceMetric(candidate.m)) {
    return false;
  }
  if (candidate.f !== undefined && !areValidComputedMetricSourceFilters(candidate.f)) {
    return false;
  }
  if (candidate.c !== undefined && !isNonEmptyString(candidate.c)) {
    return false;
  }
  if (candidate.p !== undefined && !isValidCompactPseudoDimensionValues(candidate.p)) {
    return false;
  }
  return true;
};

const isCompactComputedMetricQueryParam = (
  value: unknown,
): value is CompactComputedMetricQueryParamV2 => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<CompactComputedMetricQueryParamV2>;
  if (candidate.v !== LatestCompactComputedMetricPayloadVersion) {
    return false;
  }
  if (!Array.isArray(candidate.s) || candidate.s.length === 0 || !isNonEmptyString(candidate.f)) {
    return false;
  }
  if (!(candidate.n === undefined || typeof candidate.n === 'string')) {
    return false;
  }
  return candidate.s.every((entry) => isCompactComputedMetricSourceEntry(entry));
};

const safeParseJson = (value: string): unknown => {
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
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
};

const decodeFromBase64Url = (value: string): Uint8Array | null => {
  if (!isNonEmptyString(value) || !/^[A-Za-z0-9_-]+$/u.test(value)) {
    return null;
  }
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
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

const toCompactPseudoDimensionValues = (
  values: TRAQIV2UIMetricFanoutDimensionValues | undefined,
  aggregationType?: RAQIV2AggregationType,
): CompactPseudoDimensionValues | undefined => {
  if (!values && !aggregationType) {
    return undefined;
  }
  const compact: CompactPseudoDimensionValues = {};
  if (aggregationType ?? values?.aggregationType) {
    compact.a = aggregationType ?? values?.aggregationType ?? undefined;
  }
  if (values?.percentile) {
    compact.p = values.percentile;
  }
  return Object.keys(compact).length > 0 ? compact : undefined;
};

const fromCompactPseudoDimensionValues = (
  compact: CompactPseudoDimensionValues | undefined,
): TRAQIV2UIMetricFanoutDimensionValues | undefined => {
  if (!compact || (compact.a === undefined && compact.p === undefined)) {
    return undefined;
  }
  return {
    aggregationType: compact.a ?? null,
    percentile: compact.p ?? null,
  };
};

const toCompactSourceEntry = (
  source: ComputedMetricSource,
): CompactComputedMetricSourceEntry | null => {
  // Defensive runtime guard at the URL-serialization boundary. The static
  // type proves `metric` is a TRAQIV2NumericUIMetric (ComputedMetricSource
  // defaults its TMetric to that), but `source.metric` ultimately originates
  // from query-param strings that can drift away from the contract — keep
  // the guard alive by treating the value as unknown before validating.
  const metric: unknown = getUIMetricFromAtomicMetricLike(source.metric);
  if (!isNumericSourceMetric(metric)) {
    logAnalyticsError(`Cannot serialize non-numeric computed metric source "${String(metric)}".`);
    return null;
  }
  const entry: CompactComputedMetricSourceEntry = {
    k: source.key,
    m: metric,
  };
  // `source.filters` is structurally narrowed by `ComputedMetricSourceFilter`
  // to exclude `CustomEventName` and the fanout pseudo-dimensions, so it
  // maps 1:1 onto the `f` slot — no runtime partitioning needed.
  if (source.filters && source.filters.length > 0) {
    entry.f = [...source.filters];
  }
  // CustomEventsV2 source identity lives only on the atomic metric.
  if (isCustomEventsAtomicMetricLike(source.metric)) {
    entry.c = source.metric.customEventName;
  }
  const compactPseudoDims = toCompactPseudoDimensionValues(
    source.pseudoDimensionValues,
    isCustomEventsAtomicMetricLike(source.metric) ? source.metric.aggregationType : undefined,
  );
  if (compactPseudoDims) {
    entry.p = compactPseudoDims;
  }
  return entry;
};

const fromCompactSourceEntry = (
  entry: CompactComputedMetricSourceEntry,
): ComputedMetricSource | null => {
  const pseudoDimensionValues = fromCompactPseudoDimensionValues(entry.p);
  // Split into a typed branch per metric kind so TypeScript can preserve the
  // narrowing introduced by the `entry.m === CustomEventsV2` check (and the
  // matching `customEventName` non-empty guard) without forcing
  // `as string` / `as ComputedMetricSource['metric']` escape hatches.
  let metric: ComputedMetricSource['metric'];
  if (entry.m === RAQIV2UIMetric.CustomEventsV2) {
    const customEventName = entry.c;
    if (!customEventName) {
      return null;
    }
    metric = {
      metric: entry.m,
      customEventName,
      ...(entry.p?.a ? { aggregationType: entry.p.a } : {}),
    };
  } else {
    metric = entry.m;
  }
  return {
    key: entry.k,
    metric,
    filters: entry.f,
    ...(pseudoDimensionValues && pseudoDimensionValues.percentile
      ? {
          pseudoDimensionValues: {
            aggregationType: null,
            percentile: pseudoDimensionValues.percentile,
          },
        }
      : {}),
  };
};

export const serializeComputedMetricToQueryParam = (metric: ComputedMetric): string | null => {
  const sources: CompactComputedMetricSourceEntry[] = [];
  for (const source of metric.sources) {
    const compactSource = toCompactSourceEntry(source);
    if (!compactSource) {
      return null;
    }
    sources.push(compactSource);
  }

  const compact: CompactComputedMetricQueryParam = {
    v: LatestCompactComputedMetricPayloadVersion,
    s: sources,
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
): ComputedMetric | null => {
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

  const migrated = migrateCompactComputedMetricQueryParam(parsed);
  if (!isCompactComputedMetricQueryParam(migrated)) {
    // `isCompactComputedMetricQueryParam` runs every source's `f` through
    // `isValidComputedMetricSourceFilter`, which already rejects fanout
    // pseudo-dimensions and CustomEventName. Hand-crafted payloads that
    // smuggle source identity as a filter therefore short-circuit here.
    return null;
  }

  const [firstSource, ...otherSources] = migrated.s;
  const firstParsed = fromCompactSourceEntry(firstSource);
  const otherParsed: ComputedMetricSource[] = [];
  for (const source of otherSources) {
    const parsedSource = fromCompactSourceEntry(source);
    if (!parsedSource) {
      return null;
    }
    otherParsed.push(parsedSource);
  }
  if (!firstParsed) {
    return null;
  }

  return {
    sources: [firstParsed, ...otherParsed],
    formula: migrated.f,
    name: isNonEmptyString(migrated.n) ? migrated.n : undefined,
    l7Smoothing: migrated.l === 1,
  };
};
