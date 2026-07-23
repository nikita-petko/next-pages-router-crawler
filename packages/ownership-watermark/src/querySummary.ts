/**
 * Attribution schema v2: a self-contained, scoped RAQI query summary packed into
 * the fixed 96-bit attribution payload.
 *
 * The analytics-it-service backend treats schema v2 payloads as opaque bytes: it
 * only encrypts/MACs them on encode and returns the decrypted bytes on resolve.
 * All packing and unpacking lives here so the source-of-truth metric/dimension
 * ids come straight from `@rbx/creator-analytics-config` (see `./queryRegistry`)
 * rather than the backend. The `teamId` is the metric owner's ROS team id; the
 * resolve endpoint uses it to fetch team info, so nothing here looks it up.
 *
 * 96-bit layout (most-significant first):
 *
 *   teamId        13 bits   metric owner team id (0 = absent / unknown)
 *   resourceType   3 bits   7 non-zero ids (Universe / User / Group + future)
 *   resourceId    40 bits   universe/user/group id (~1.1e12 max; ~130x today's ids)
 *   metricId      13 bits   query registry metric id (0 = unknown)
 *   breakdownDim  13 bits   query registry dimension id (0 = none/unknown)
 *   filterDim     13 bits   query registry dimension id (0 = none/unknown)
 *   truncated      1 bit    set when query detail was dropped to fit the token
 *
 * Filter *values* are intentionally never embedded; only the dimension name is.
 */

import {
  dimensionIdFromName,
  dimensionNameFromId,
  metricIdFromName,
  metricNameFromId,
} from './queryRegistry';

/** Attribution schema id for the query summary layout. */
export const QUERY_SUMMARY_ATTRIBUTION_SCHEMA = 2;

/**
 * Queried resource types. Mirrors the creator-analytics `ChartResourceType`
 * (Group / Universe / User) and may expand; the 3-bit field allows 7 non-zero ids.
 */
export const WatermarkQueryResourceType = {
  Universe: 'Universe',
  User: 'User',
  Group: 'Group',
} as const;

export type WatermarkQueryResourceType =
  (typeof WatermarkQueryResourceType)[keyof typeof WatermarkQueryResourceType];

/**
 * Append-only resource-type ids. Never renumber an existing entry; add new
 * resource types with the next free id so old screenshots stay decodable.
 */
const RESOURCE_TYPE_IDS: Record<WatermarkQueryResourceType, number> = {
  [WatermarkQueryResourceType.Universe]: 1,
  [WatermarkQueryResourceType.User]: 2,
  [WatermarkQueryResourceType.Group]: 3,
};

const RESOURCE_TYPE_BY_ID = new Map<number, WatermarkQueryResourceType>([
  [RESOURCE_TYPE_IDS[WatermarkQueryResourceType.Universe], WatermarkQueryResourceType.Universe],
  [RESOURCE_TYPE_IDS[WatermarkQueryResourceType.User], WatermarkQueryResourceType.User],
  [RESOURCE_TYPE_IDS[WatermarkQueryResourceType.Group], WatermarkQueryResourceType.Group],
]);

const ATTRIBUTION_BYTE_LENGTH = 12;

const TEAM_BITS = 13n;
const RESOURCE_TYPE_BITS = 3n;
const RESOURCE_ID_BITS = 40n;
const METRIC_BITS = 13n;
const BREAKDOWN_BITS = 13n;
const FILTER_BITS = 13n;
const TRUNCATED_BITS = 1n;

const MAX_RESOURCE_ID = (1n << RESOURCE_ID_BITS) - 1n;
const MAX_TEAM_ID = (1n << TEAM_BITS) - 1n;

const TOTAL_BITS =
  TEAM_BITS +
  RESOURCE_TYPE_BITS +
  RESOURCE_ID_BITS +
  METRIC_BITS +
  BREAKDOWN_BITS +
  FILTER_BITS +
  TRUNCATED_BITS;

// Layout invariant: the field widths must exactly fill the payload. Guards
// against a field being resized without rebalancing the rest of the 96 bits.
if (TOTAL_BITS !== BigInt(ATTRIBUTION_BYTE_LENGTH) * 8n) {
  throw new Error(
    `query summary layout must total ${ATTRIBUTION_BYTE_LENGTH * 8} bits, got ${TOTAL_BITS}`,
  );
}

/** A scoped RAQI query summary to embed in a watermark. */
export type QuerySummary = {
  /** Opaque metric owner team id. Omitted when metric ownership is unknown. */
  teamId?: number | string | bigint | null;
  /** Queried resource type (Universe / User / Group). */
  resourceType: WatermarkQueryResourceType;
  /** Positive queried resource id (universe / user / group id). */
  resourceId: number | string | bigint;
  /** RAQI metric name, e.g. `SessionDurationSecondsAvg`. Required. */
  metric: string;
  /** Single breakdown dimension name. Additional breakdowns set `truncated`. */
  breakdownDimension?: string | null;
  /** Single filter dimension name (the value is intentionally not embedded). */
  filterDimension?: string | null;
  /** Set when the caller dropped query detail that does not fit the token. */
  truncated?: boolean;
};

/** A query summary recovered from a decrypted schema v2 payload. */
export type ResolvedQuerySummary = {
  /** Decimal string; null when team ownership was not embedded. */
  teamId: string | null;
  resourceType: WatermarkQueryResourceType | null;
  /** Decimal string; the id can exceed 2^32. */
  resourceId: string;
  metric: string | null;
  breakdownDimension: string | null;
  filterDimension: string | null;
  truncated: boolean;
};

function mask(bits: bigint): bigint {
  return (1n << bits) - 1n;
}

function toResourceId(value: number | string | bigint): bigint {
  if (typeof value === 'string' && value.trim().length === 0) {
    throw new RangeError('query resourceId must be a positive integer, got an empty string');
  }

  let resourceId: bigint;
  try {
    resourceId = typeof value === 'bigint' ? value : BigInt(value);
  } catch (error) {
    throw new RangeError(`query resourceId must be an integer, got ${String(value)}`, {
      cause: error,
    });
  }
  if (resourceId <= 0n || resourceId > MAX_RESOURCE_ID) {
    throw new RangeError(
      `query resourceId must be between 1 and ${MAX_RESOURCE_ID}, got ${resourceId}`,
    );
  }
  return resourceId;
}

/**
 * Resolve the optional ROS owner team id into the 13-bit field. Absent input is
 * id 0. A team id that does not fit the field (a future ROS id above the 13-bit
 * maximum) fails open — it is dropped to 0 and `dropped` is set so the caller
 * can mark the summary truncated, rather than throwing and breaking encode.
 */
function toOptionalTeamId(value: number | string | bigint | null | undefined): {
  teamId: bigint;
  dropped: boolean;
} {
  if (value === null || value === undefined) {
    return { teamId: 0n, dropped: false };
  }
  if (typeof value === 'string' && value.trim().length === 0) {
    throw new RangeError('query teamId must be a positive integer, got an empty string');
  }

  let teamId: bigint;
  try {
    teamId = typeof value === 'bigint' ? value : BigInt(value);
  } catch (error) {
    throw new RangeError(`query teamId must be an integer, got ${String(value)}`, {
      cause: error,
    });
  }
  if (teamId <= 0n) {
    throw new RangeError(`query teamId must be a positive integer, got ${teamId}`);
  }
  if (teamId > MAX_TEAM_ID) {
    return { teamId: 0n, dropped: true };
  }
  return { teamId, dropped: false };
}

function bigIntToBytes(value: bigint, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  let remaining = value;
  for (let index = length - 1; index >= 0; index -= 1) {
    bytes[index] = Number(remaining & 255n);
    remaining >>= 8n;
  }
  return bytes;
}

function bytesToBigInt(bytes: Uint8Array): bigint {
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }
  return value;
}

function assertFitsBitField(fieldName: string, value: number, bits: bigint): void {
  const maxValue = Number(mask(bits));
  if (value > maxValue) {
    throw new RangeError(
      `query ${fieldName} id ${value} exceeds the ${bits}-bit field maximum ${maxValue}`,
    );
  }
}

/**
 * Pack a query summary into the 96-bit attribution payload. Unknown metric or
 * dimension names (and resource types) resolve to id 0 and set `truncated`. The
 * returned `truncated` reflects the caller's flag merged with any dropped detail.
 */
export function packQuerySummary(summary: QuerySummary): {
  attributionData: Uint8Array;
  truncated: boolean;
} {
  let truncated = summary.truncated ?? false;

  const resourceTypeId = RESOURCE_TYPE_IDS[summary.resourceType] ?? 0;
  if (resourceTypeId === 0) {
    truncated = true;
  }

  const resourceId = toResourceId(summary.resourceId);

  const metricId = metricIdFromName(summary.metric);
  if (metricId === 0) {
    truncated = true;
  }
  assertFitsBitField('metric', metricId, METRIC_BITS);

  const breakdownId = dimensionIdFromName(summary.breakdownDimension);
  if (summary.breakdownDimension && breakdownId === 0) {
    truncated = true;
  }
  assertFitsBitField('breakdown dimension', breakdownId, BREAKDOWN_BITS);

  const filterId = dimensionIdFromName(summary.filterDimension);
  if (summary.filterDimension && filterId === 0) {
    truncated = true;
  }
  assertFitsBitField('filter dimension', filterId, FILTER_BITS);

  const { teamId, dropped: teamIdDropped } = toOptionalTeamId(summary.teamId);
  if (teamIdDropped) {
    truncated = true;
  }

  let packed = teamId;
  packed = (packed << RESOURCE_TYPE_BITS) | BigInt(resourceTypeId);
  packed = (packed << RESOURCE_ID_BITS) | resourceId;
  packed = (packed << METRIC_BITS) | BigInt(metricId);
  packed = (packed << BREAKDOWN_BITS) | BigInt(breakdownId);
  packed = (packed << FILTER_BITS) | BigInt(filterId);
  packed = (packed << TRUNCATED_BITS) | (truncated ? 1n : 0n);

  return { attributionData: bigIntToBytes(packed, ATTRIBUTION_BYTE_LENGTH), truncated };
}

/** Unpack a decrypted schema v2 attribution payload into a query summary. */
export function unpackQuerySummary(attributionData: Uint8Array): ResolvedQuerySummary {
  if (attributionData.length !== ATTRIBUTION_BYTE_LENGTH) {
    throw new Error(
      `query attribution payload must be ${ATTRIBUTION_BYTE_LENGTH} bytes, got ${attributionData.length}`,
    );
  }

  let packed = bytesToBigInt(attributionData);

  const truncated = (packed & mask(TRUNCATED_BITS)) !== 0n;
  packed >>= TRUNCATED_BITS;
  const filterId = Number(packed & mask(FILTER_BITS));
  packed >>= FILTER_BITS;
  const breakdownId = Number(packed & mask(BREAKDOWN_BITS));
  packed >>= BREAKDOWN_BITS;
  const metricId = Number(packed & mask(METRIC_BITS));
  packed >>= METRIC_BITS;
  const resourceId = packed & mask(RESOURCE_ID_BITS);
  packed >>= RESOURCE_ID_BITS;
  const resourceTypeId = Number(packed & mask(RESOURCE_TYPE_BITS));
  packed >>= RESOURCE_TYPE_BITS;
  const teamId = packed & mask(TEAM_BITS);

  return {
    teamId: teamId === 0n ? null : teamId.toString(),
    resourceType: RESOURCE_TYPE_BY_ID.get(resourceTypeId) ?? null,
    resourceId: resourceId.toString(),
    metric: metricNameFromId(metricId),
    breakdownDimension: dimensionNameFromId(breakdownId),
    filterDimension: dimensionNameFromId(filterId),
    truncated,
  };
}
