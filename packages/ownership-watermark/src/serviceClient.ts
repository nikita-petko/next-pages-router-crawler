import {
  createOpaqueOwnershipPayload,
  PAYLOAD_VERSION_V3,
  WATERMARK_CODEC_PROFILE_V1,
  type OwnershipPayload,
  type OwnershipPayloadV3,
} from './core';
import {
  packQuerySummary,
  QUERY_SUMMARY_ATTRIBUTION_SCHEMA,
  unpackQuerySummary,
  WatermarkQueryResourceType,
  type QuerySummary,
} from './querySummary';

export { WatermarkQueryResourceType };

const CSRF_TOKEN_HEADER = 'x-csrf-token';
const WATERMARK_SERVICE_PATH = '/analytics-it-service/v1/watermarks';

export const WATERMARK_ENCODE_PATH = `${WATERMARK_SERVICE_PATH}/encode`;
export const WATERMARK_RESOLVE_PATH = `${WATERMARK_SERVICE_PATH}/resolve`;
export const DEFAULT_WATERMARK_SOURCE_PRODUCT = 'creator-dashboard';

export const WatermarkSubjectType = {
  Team: 'team',
  Conversation: 'conversation',
  Query: 'query',
} as const;

export type WatermarkSubjectType = (typeof WatermarkSubjectType)[keyof typeof WatermarkSubjectType];

export type WatermarkEncodeTeamSubject = {
  type: typeof WatermarkSubjectType.Team;
  teamId: number | string;
};

export type WatermarkEncodeConversationSubject = {
  type: typeof WatermarkSubjectType.Conversation;
  conversationId: string;
};

/**
 * A self-contained RAQI query summary embedded as attribution schema v2. The package packs these
 * fields into the fixed 96-bit payload using metric/dimension ids derived from
 * `@rbx/creator-analytics-config`; the backend only encrypts and decrypts the bytes. Names it does
 * not recognize resolve to empty and set `truncated`. A query subject is self-contained (it carries
 * its own team ownership when known, plus its own resource) and cannot be combined with other
 * subjects.
 */
export type WatermarkEncodeQuerySubject = {
  type: typeof WatermarkSubjectType.Query;
} & QuerySummary;

export type WatermarkEncodeSubject =
  | WatermarkEncodeTeamSubject
  | WatermarkEncodeConversationSubject
  | WatermarkEncodeQuerySubject;

export type EncodeOwnershipWatermarkRequest = {
  subjects: readonly WatermarkEncodeSubject[];
  sourceProduct?: string | null;
};

export type WatermarkTokenDto = {
  version: number;
  codecProfile: number;
  keyEpoch: number;
  flags: number;
  attributionData: string;
  serverMac: string;
};

export type WatermarkTokenDiagnostics = Omit<WatermarkTokenDto, 'serverMac'>;

export type EncodeOwnershipWatermarkOptions = {
  encodeUrl?: string | null;
  request: EncodeOwnershipWatermarkRequest;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
};

export type WatermarkResolvedSubjectDto = {
  type?: string;
  teamId?: string;
  /** Human-readable owner team name resolved from `teamId` by the resolve endpoint. */
  teamName?: string;
  conversationId?: string;
  conversationDisplaySuffix?: string;
  resourceType?: WatermarkQueryResourceType;
  resourceId?: string;
  metric?: string;
  breakdownDimension?: string;
  filterDimension?: string;
  truncated?: boolean;
};

export type ResolveWatermarkResponseDto = {
  found: boolean;
  subjects?: WatermarkResolvedSubjectDto[] | null;
  /** Attribution schema id recovered from the token flags (1 = subjects, 2 = query summary). */
  attributionSchema?: number;
  sourceProduct?: string | null;
};

export type ResolveOwnershipWatermarkOptions = {
  payload: OwnershipPayload;
  resolveUrl?: string | null;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
};

type EncodeWatermarkResponseDto = {
  token: WatermarkTokenDto;
  resolvedMetadataPreview?: unknown;
};

type SerializedWatermarkSubject =
  | {
      type: typeof WatermarkSubjectType.Team;
      teamId: string;
    }
  | {
      type: typeof WatermarkSubjectType.Conversation;
      conversationId: string;
    };

/**
 * The encode request is either a list of service-packed subjects (schema v1) or a
 * package-packed opaque attribution payload (schema v2 query summary).
 */
type SerializedEncodeWatermarkRequest =
  | {
      subjects: SerializedWatermarkSubject[];
      sourceProduct?: string;
    }
  | {
      attributionData: string;
      attributionSchema: number;
      sourceProduct?: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readBedev2BaseUrl(): string | undefined {
  if (typeof process === 'undefined') {
    return undefined;
  }
  const baseUrl = process.env.bedev2BaseUrl;
  return typeof baseUrl === 'string' && baseUrl.length > 0
    ? baseUrl.replace(/\/+$/u, '')
    : undefined;
}

export function getDefaultWatermarkEncodeUrl(): string | undefined {
  const baseUrl = readBedev2BaseUrl();
  return baseUrl ? `${baseUrl}${WATERMARK_ENCODE_PATH}` : undefined;
}

export function getDefaultWatermarkResolveUrl(): string | undefined {
  const baseUrl = readBedev2BaseUrl();
  return baseUrl ? `${baseUrl}${WATERMARK_RESOLVE_PATH}` : undefined;
}

function getFetch(fetchImpl?: typeof fetch): typeof fetch {
  const send = fetchImpl ?? (typeof fetch === 'function' ? fetch : undefined);
  if (!send) {
    throw new Error('Ownership watermark service request failed: fetch is not available.');
  }
  return send;
}

function normalizeSubject(subject: WatermarkEncodeSubject): SerializedWatermarkSubject {
  if (subject.type === WatermarkSubjectType.Team) {
    return {
      type: WatermarkSubjectType.Team,
      teamId: String(subject.teamId),
    };
  }

  if (subject.type === WatermarkSubjectType.Conversation) {
    return {
      type: WatermarkSubjectType.Conversation,
      conversationId: subject.conversationId,
    };
  }

  // Query subjects are packed separately (schema v2); they never reach this path.
  throw new Error('A query watermark subject cannot be combined with other subjects.');
}

function normalizeRequest(
  request: EncodeOwnershipWatermarkRequest,
): SerializedEncodeWatermarkRequest {
  const querySubject = request.subjects.find(
    (subject): subject is WatermarkEncodeQuerySubject =>
      subject.type === WatermarkSubjectType.Query,
  );

  if (querySubject) {
    if (request.subjects.length !== 1) {
      throw new Error('A query watermark subject cannot be combined with other subjects.');
    }

    const { attributionData } = packQuerySummary(querySubject);
    return {
      attributionData: bytesToBase64Url(attributionData),
      attributionSchema: QUERY_SUMMARY_ATTRIBUTION_SCHEMA,
      ...(request.sourceProduct ? { sourceProduct: request.sourceProduct } : {}),
    };
  }

  return {
    subjects: request.subjects.map(normalizeSubject),
    ...(request.sourceProduct ? { sourceProduct: request.sourceProduct } : {}),
  };
}

function createJsonRequest(
  body: unknown,
  signal: AbortSignal | undefined,
  csrfToken?: string,
): RequestInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (csrfToken) {
    headers[CSRF_TOKEN_HEADER] = csrfToken;
  }

  return {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(body),
    signal,
  };
}

async function fetchWithCsrfRetry({
  url,
  body,
  signal,
  fetchImpl,
  failureMessage,
}: {
  url: string;
  body: unknown;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  failureMessage: string;
}): Promise<Response> {
  const send = getFetch(fetchImpl);
  try {
    const response = await send(url, createJsonRequest(body, signal));
    if (response.status !== 403) {
      return response;
    }

    const csrfToken = response.headers.get(CSRF_TOKEN_HEADER);
    if (!csrfToken) {
      return response;
    }

    return await send(url, createJsonRequest(body, signal, csrfToken));
  } catch (error) {
    throw new Error(failureMessage, { cause: error });
  }
}

function parseToken(value: unknown): WatermarkTokenDto | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    typeof value.version !== 'number' ||
    typeof value.codecProfile !== 'number' ||
    typeof value.keyEpoch !== 'number' ||
    typeof value.flags !== 'number' ||
    typeof value.attributionData !== 'string' ||
    typeof value.serverMac !== 'string'
  ) {
    return null;
  }

  return {
    version: value.version,
    codecProfile: value.codecProfile,
    keyEpoch: value.keyEpoch,
    flags: value.flags,
    attributionData: value.attributionData,
    serverMac: value.serverMac,
  };
}

function parseEncodeResponse(value: unknown): EncodeWatermarkResponseDto | null {
  if (!isRecord(value)) {
    return null;
  }
  const token = parseToken(value.token);
  return token ? { token, resolvedMetadataPreview: value.resolvedMetadataPreview } : null;
}

export function parseResolveResponse(value: unknown): ResolveWatermarkResponseDto | null {
  if (!isRecord(value) || typeof value.found !== 'boolean') {
    return null;
  }

  const attributionSchema =
    typeof value.attributionSchema === 'number' ? value.attributionSchema : undefined;
  const sourceProduct = typeof value.sourceProduct === 'string' ? value.sourceProduct : null;

  // Client-owned schema v2: the backend returns opaque decrypted bytes; unpack the query
  // summary here using the package's metric/dimension registry.
  if (
    typeof value.attributionData === 'string' &&
    attributionSchema === QUERY_SUMMARY_ATTRIBUTION_SCHEMA
  ) {
    let summary: ReturnType<typeof unpackQuerySummary>;
    try {
      summary = unpackQuerySummary(base64UrlToBytes(value.attributionData));
    } catch {
      // Malformed opaque payload (bad base64url or wrong byte length) — treat the
      // whole resolve response as invalid rather than leaking an encode-path error.
      return null;
    }
    return {
      found: value.found,
      attributionSchema,
      subjects: [
        {
          type: WatermarkSubjectType.Query,
          teamId: summary.teamId ?? undefined,
          // teamId is embedded in the token; the owner name is resolved by the
          // endpoint from the ROS team id and returned alongside the bytes.
          teamName: typeof value.teamName === 'string' ? value.teamName : undefined,
          resourceType: summary.resourceType ?? undefined,
          resourceId: summary.resourceId,
          metric: summary.metric ?? undefined,
          breakdownDimension: summary.breakdownDimension ?? undefined,
          filterDimension: summary.filterDimension ?? undefined,
          truncated: summary.truncated,
        },
      ],
      sourceProduct,
    };
  }

  const subjects = Array.isArray(value.subjects)
    ? value.subjects.filter(isRecord).map((subject) => ({
        type: typeof subject.type === 'string' ? subject.type : undefined,
        teamId: typeof subject.teamId === 'string' ? subject.teamId : undefined,
        teamName: typeof subject.teamName === 'string' ? subject.teamName : undefined,
        conversationId:
          typeof subject.conversationId === 'string' ? subject.conversationId : undefined,
        conversationDisplaySuffix:
          typeof subject.conversationDisplaySuffix === 'string'
            ? subject.conversationDisplaySuffix
            : undefined,
      }))
    : null;

  return {
    found: value.found,
    subjects,
    attributionSchema,
    sourceProduct,
  };
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  if (value.length % 4 === 1) {
    throw new Error('Encode service returned invalid token encoding.');
  }
  if (!/^[A-Za-z0-9_-]*$/u.test(value)) {
    throw new Error('Encode service returned invalid token encoding.');
  }
  if (typeof atob !== 'function') {
    throw new TypeError('Encode service response cannot be decoded in this runtime.');
  }

  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padding = (4 - (normalized.length % 4)) % 4;
  let binary: string;
  try {
    binary = atob(`${normalized}${'='.repeat(padding)}`);
  } catch (error) {
    throw new Error('Encode service returned invalid token encoding.', { cause: error });
  }
  return Uint8Array.from({ length: binary.length }, (_, index) => binary.charCodeAt(index));
}

export function payloadFromToken(token: WatermarkTokenDto): OwnershipPayloadV3 {
  if (token.version !== PAYLOAD_VERSION_V3) {
    throw new Error('Encode service returned an unsupported token version.');
  }
  if (token.codecProfile !== WATERMARK_CODEC_PROFILE_V1) {
    throw new Error('Encode service returned an unsupported codec profile.');
  }

  return createOpaqueOwnershipPayload({
    attributionData: base64UrlToBytes(token.attributionData),
    serverMac: base64UrlToBytes(token.serverMac),
    keyEpoch: token.keyEpoch,
    flags: token.flags,
    codecProfile: token.codecProfile,
  });
}

export function tokenFromPayload(payload: OwnershipPayload): WatermarkTokenDto {
  return {
    version: payload.version,
    codecProfile: payload.codecProfile,
    keyEpoch: payload.keyEpoch,
    flags: payload.flags,
    attributionData: bytesToBase64Url(payload.attributionData),
    serverMac: bytesToBase64Url(payload.serverMac),
  };
}

export function tokenDiagnosticsFromDto(token: WatermarkTokenDto): WatermarkTokenDiagnostics {
  return {
    version: token.version,
    codecProfile: token.codecProfile,
    keyEpoch: token.keyEpoch,
    flags: token.flags,
    attributionData: token.attributionData,
  };
}

function readEncodeFailure(response: Response): string {
  const status = `${response.status}${response.statusText ? ` ${response.statusText}` : ''}`;
  return `Encode service rejected the request (${status}).`;
}

async function readResolveFailure(response: Response): Promise<string> {
  const status = `${response.status}${response.statusText ? ` ${response.statusText}` : ''}`;
  try {
    const body: unknown = await response.json();
    if (isRecord(body)) {
      const detail = typeof body.detail === 'string' ? body.detail : null;
      const title = typeof body.title === 'string' ? body.title : null;
      if (detail && title) {
        return `Resolve service rejected the token (${status}): ${title} ${detail}`;
      }
      if (detail ?? title) {
        return `Resolve service rejected the token (${status}): ${detail ?? title}`;
      }
    }
  } catch {
    // Fall through to the status-only message when the service did not return JSON.
  }

  return `Resolve service rejected the token (${status}).`;
}

function resolveEndpoint(url: string | null | undefined, fallback: string | undefined): string {
  if (url) {
    return url;
  }
  if (fallback) {
    return fallback;
  }
  throw new Error('Ownership watermark service endpoint is not configured.');
}

export async function encodeOwnershipWatermark({
  encodeUrl,
  request,
  signal,
  fetchImpl,
}: EncodeOwnershipWatermarkOptions): Promise<OwnershipPayloadV3> {
  const response = await fetchWithCsrfRetry({
    url: resolveEndpoint(encodeUrl, getDefaultWatermarkEncodeUrl()),
    body: normalizeRequest(request),
    signal,
    fetchImpl,
    failureMessage: 'Encode service request failed.',
  });
  if (!response.ok) {
    throw new Error(readEncodeFailure(response));
  }

  const parsed = parseEncodeResponse(await response.json());
  if (!parsed) {
    throw new Error('Encode service returned an unexpected response shape.');
  }

  return payloadFromToken(parsed.token);
}

export async function resolveOwnershipWatermark({
  payload,
  resolveUrl,
  signal,
  fetchImpl,
}: ResolveOwnershipWatermarkOptions): Promise<ResolveWatermarkResponseDto> {
  const response = await fetchWithCsrfRetry({
    url: resolveEndpoint(resolveUrl, getDefaultWatermarkResolveUrl()),
    body: tokenFromPayload(payload),
    signal,
    fetchImpl,
    failureMessage: 'Resolve service request failed.',
  });

  if (!response.ok) {
    throw new Error(await readResolveFailure(response));
  }

  const parsed = parseResolveResponse(await response.json());
  if (!parsed) {
    throw new Error('Resolve service returned an unexpected response shape.');
  }

  return parsed;
}
