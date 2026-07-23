import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { RAQIV2FilterOperation } from '@modules/clients/analytics';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  runVersionedMigrations,
  type VersionedMigrationStep,
} from '../utils/runVersionedMigrations';

export const LatestCompactComputedMetricPayloadVersion = 2;

const LegacyCompactComputedMetricPayloadVersion = 1;

type CompactSourceWithFilters = {
  readonly f?: readonly unknown[];
  readonly c?: unknown;
};

type CompactComputedMetricDocument = Record<string, unknown> & {
  readonly s?: readonly unknown[];
  readonly v?: unknown;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isCompactComputedMetricDocument = (value: unknown): value is CompactComputedMetricDocument =>
  isObjectRecord(value);

const isStringArray = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');

const isEnumPrimitive = (value: unknown): value is string | number =>
  typeof value === 'string' || typeof value === 'number';

const isValidFilterOperation = (
  value: unknown,
): value is Exclude<RAQIV2FilterOperation, typeof RAQIV2FilterOperation.Invalid> =>
  isEnumPrimitive(value) &&
  isValidEnumValue(RAQIV2FilterOperation, value) &&
  value !== RAQIV2FilterOperation.Invalid;

const isCustomEventNameFilter = (
  value: unknown,
): value is { readonly dimension: unknown; readonly values: readonly string[] } => {
  if (!isObjectRecord(value)) {
    return false;
  }
  return (
    value.dimension === RAQIV2Dimension.CustomEventName &&
    isStringArray(value.values) &&
    (value.operation === undefined || isValidFilterOperation(value.operation))
  );
};

const splitCustomEventNameFromFilters = (
  filters: readonly unknown[],
): {
  customEventName: string | undefined;
  realFilters: readonly unknown[] | undefined;
} => {
  let customEventName: string | undefined;
  const realFilters = filters.filter((filter) => {
    if (!isCustomEventNameFilter(filter)) {
      return true;
    }
    customEventName ??= filter.values[0];
    return false;
  });

  return {
    customEventName,
    realFilters: realFilters.length > 0 ? realFilters : undefined,
  };
};

const getCompactComputedMetricPayloadVersion = (document: unknown): number => {
  if (!isCompactComputedMetricDocument(document)) {
    return LatestCompactComputedMetricPayloadVersion;
  }
  const { v } = document;
  if (v === undefined) {
    return LegacyCompactComputedMetricPayloadVersion;
  }
  return typeof v === 'number' ? v : LatestCompactComputedMetricPayloadVersion + 1;
};

const setCompactComputedMetricPayloadVersion = (document: unknown, version: number): unknown => {
  if (!isCompactComputedMetricDocument(document)) {
    return document;
  }
  return { ...document, v: version };
};

const migrateCompactComputedMetricSourceV1ToV2 = (source: unknown): unknown => {
  if (!isObjectRecord(source)) {
    return source;
  }
  const sourceFilters = source.f;
  if (!Array.isArray(sourceFilters)) {
    return source;
  }

  const sourceEntry: CompactSourceWithFilters = source;
  const { customEventName, realFilters } = splitCustomEventNameFromFilters(sourceFilters);
  return {
    ...sourceEntry,
    ...(realFilters ? { f: realFilters } : { f: undefined }),
    ...(sourceEntry.c === undefined && customEventName ? { c: customEventName } : {}),
  };
};

const migrateCompactComputedMetricQueryParamV1ToV2 = (document: unknown): unknown => {
  if (!isCompactComputedMetricDocument(document) || !Array.isArray(document.s)) {
    return document;
  }

  return {
    ...document,
    s: document.s.map(migrateCompactComputedMetricSourceV1ToV2),
  };
};

const compactComputedMetricQueryParamMigrations: readonly VersionedMigrationStep<unknown>[] = [
  {
    fromVersion: 1,
    toVersion: 2,
    description: 'Lift CustomEventName filters into source identity',
    migrate: migrateCompactComputedMetricQueryParamV1ToV2,
  },
];

export const migrateCompactComputedMetricQueryParam = (document: unknown): unknown => {
  try {
    return runVersionedMigrations({
      document,
      registry: compactComputedMetricQueryParamMigrations,
      targetVersion: LatestCompactComputedMetricPayloadVersion,
      getVersion: getCompactComputedMetricPayloadVersion,
      setVersion: setCompactComputedMetricPayloadVersion,
    });
  } catch {
    return null;
  }
};
