/**
 * Metric / dimension id resolution for the ownership *query* registry.
 *
 * Attribution schema v2 embeds a metric owner team id plus a scoped RAQI query
 * summary (resource + metric + one breakdown + one filter dimension) into the
 * fixed 96-bit attribution payload. This module supplies the compact ids for
 * metric and dimension names; team ids come from `teamOwnershipByMetric`.
 *
 * The ids come straight from `@rbx/creator-analytics-config` (`IdByMetric` /
 * `IdByDimension`) — the config owns the numbering, so there is no local
 * append-only registry to keep in sync. Config ids are 0-based and id 0 is a
 * real metric/dimension, but the payload reserves id 0 as "absent / unknown",
 * so every id is stored offset by {@link ID_OFFSET} (+1). Decoders subtract the
 * offset before resolving the name.
 *
 * Metric names arriving from Creator Hub chart specs are UI metric names. Most
 * are also API metric names (present in `IdByMetric`); the handful of
 * percentile / aggregation "family" UI metrics (e.g. `ClientFps`) are not, so
 * they resolve through `RAQIV2UIMetricToAPIConfig` to their `defaultMetric`'s
 * id on encode. Decode searches only `IdByMetric` canonical names, so a stored
 * id always round-trips to a single API name even though a UI alias and its
 * `defaultMetric` share an id.
 */

import {
  IdByDimension,
  IdByMetric,
  RAQIV2UIMetricToAPIConfig,
} from '@rbx/creator-analytics-config';

/** Reserved id meaning "absent / unknown" for any query-summary field. */
export const QUERY_REGISTRY_UNKNOWN_ID = 0;

/** Query summary bit fields allocate 13 bits per registry id. */
export const QUERY_REGISTRY_MAX_ID = (1 << 13) - 1;

/**
 * Config ids are 0-based and id 0 is a valid metric/dimension, but the payload
 * reserves id 0 as "absent". Store every id offset by +1 so 0 stays "absent".
 */
const ID_OFFSET = 1;

function assertFitsBitField(kind: string, name: string, storedId: number): void {
  if (storedId > QUERY_REGISTRY_MAX_ID) {
    throw new RangeError(
      `query ${kind} id ${storedId} for ${JSON.stringify(name)} exceeds the 13-bit field maximum ${QUERY_REGISTRY_MAX_ID}`,
    );
  }
}

function storedIdFromConfigId(kind: string, name: string, configId: number): number {
  const storedId = configId + ID_OFFSET;
  assertFitsBitField(kind, name, storedId);
  return storedId;
}

function configIdFromStoredId(storedId: number): number | null {
  if (!Number.isInteger(storedId) || storedId <= QUERY_REGISTRY_UNKNOWN_ID) {
    return null;
  }
  return storedId - ID_OFFSET;
}

const hasMetricId = (name: string): name is keyof typeof IdByMetric =>
  Object.hasOwn(IdByMetric, name);

const hasUIMetricConfig = (name: string): name is keyof typeof RAQIV2UIMetricToAPIConfig =>
  Object.hasOwn(RAQIV2UIMetricToAPIConfig, name);

const hasDimensionId = (name: string): name is keyof typeof IdByDimension =>
  Object.hasOwn(IdByDimension, name);

/** Resolve a metric name to its stored id (0 = unknown/absent). */
export function metricIdFromName(name: string | null | undefined): number {
  if (!name) {
    return QUERY_REGISTRY_UNKNOWN_ID;
  }
  if (hasMetricId(name)) {
    return storedIdFromConfigId('metric', name, IdByMetric[name]);
  }
  if (!hasUIMetricConfig(name)) {
    return QUERY_REGISTRY_UNKNOWN_ID;
  }
  const defaultMetric = RAQIV2UIMetricToAPIConfig[name].defaultMetric;
  return storedIdFromConfigId('metric', name, IdByMetric[defaultMetric]);
}

/** Resolve a stored metric id to its canonical API metric name, or null. */
export function metricNameFromId(storedId: number): string | null {
  const configId = configIdFromStoredId(storedId);
  if (configId === null) {
    return null;
  }
  for (const [name, id] of Object.entries(IdByMetric)) {
    if (id === configId) {
      return name;
    }
  }
  return null;
}

/** Resolve a dimension name to its stored id (0 = unknown/absent). */
export function dimensionIdFromName(name: string | null | undefined): number {
  if (!name || !hasDimensionId(name)) {
    return QUERY_REGISTRY_UNKNOWN_ID;
  }
  return storedIdFromConfigId('dimension', name, IdByDimension[name]);
}

/** Resolve a stored dimension id to its canonical dimension name, or null. */
export function dimensionNameFromId(storedId: number): string | null {
  const configId = configIdFromStoredId(storedId);
  if (configId === null) {
    return null;
  }
  for (const [name, id] of Object.entries(IdByDimension)) {
    if (id === configId) {
      return name;
    }
  }
  return null;
}
