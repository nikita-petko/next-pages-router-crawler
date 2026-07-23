import type { components } from '@rbx/client-analytics-custom-dashboards-api/openapi-typescript/v1Paths';
import {
  backendDocumentToCustomDashboardConfig,
  customDashboardConfigToBackendDocument,
} from '../backendContract';
import {
  CUSTOM_DASHBOARD_CURRENT_SCHEMA_VERSION,
  EMPTY_DASHBOARD_CONFIG,
  type CustomDashboardConfig,
  type CustomDashboardDocument,
  type CustomDashboardStatus,
} from '../types';
import { validateDashboardDescription, validateDashboardName } from '../utils/validators';
import type {
  ApiDashboard,
  ApiDashboardDocument,
  ApiDashboardMetadata,
} from './customDashboardsApiClient';

type ApiTimestamp = components['schemas']['Google.Protobuf.WellKnownTypes.Timestamp'];

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function timestampToIso(value: ApiTimestamp | string | undefined | null): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (!isObjectRecord(value)) {
    return undefined;
  }
  const { seconds } = value;
  if (typeof seconds === 'number' || typeof seconds === 'string') {
    const parsedSeconds = typeof seconds === 'number' ? seconds : Number(seconds);
    const rawNanos = value.nanos;
    const nanos =
      typeof rawNanos === 'number' ? rawNanos : typeof rawNanos === 'string' ? Number(rawNanos) : 0;
    if (Number.isFinite(parsedSeconds) && Number.isFinite(nanos)) {
      return new Date(parsedSeconds * 1000 + Math.floor(nanos / 1_000_000)).toISOString();
    }
  }
  return undefined;
}

function fallbackIso(): string {
  return new Date(0).toISOString();
}

function actorUserIdToNumber(value: unknown): number | undefined {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim().length > 0
        ? Number(value)
        : Number.NaN;
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function getDashboardId(metadata: ApiDashboardMetadata): string {
  return metadata.dashboardId ?? '';
}

export function getHeadEtag(metadata: ApiDashboardMetadata): string | undefined {
  return metadata.headEtag ?? undefined;
}

export function getLatestPublishedVersion(metadata: ApiDashboardMetadata): number | undefined {
  return metadata.latestPublishedVersion;
}

function toStatus(metadata: ApiDashboardMetadata): CustomDashboardStatus {
  const latestPublishedDocumentId = metadata.latestPublishedDocumentId;
  const latestPublishedVersion = getLatestPublishedVersion(metadata) ?? 0;
  return latestPublishedDocumentId || latestPublishedVersion > 0 ? 'published' : 'draft';
}

export function toApiDashboardDocument(config: CustomDashboardConfig): ApiDashboardDocument {
  return customDashboardConfigToBackendDocument(config);
}

export function fromApiDashboardDocument(document?: ApiDashboardDocument): CustomDashboardConfig {
  if (!document) {
    return EMPTY_DASHBOARD_CONFIG;
  }
  return backendDocumentToCustomDashboardConfig(document);
}

export function fromApiDashboardMetadata(
  metadata: ApiDashboardMetadata,
  config: CustomDashboardConfig = EMPTY_DASHBOARD_CONFIG,
): CustomDashboardDocument {
  const dashboardId = getDashboardId(metadata);
  const universeId = metadata.universeId ?? 0;
  const createdAt = timestampToIso(metadata.createdTime) ?? fallbackIso();
  const updatedAt = timestampToIso(metadata.updatedTime) ?? createdAt;
  const publishedAt = timestampToIso(metadata.publishedTime);
  const isPinned = metadata.isPinned === true;
  const createdBy = metadata.createdBy;
  const updatedBy = metadata.updatedBy;
  const createdByUserId = actorUserIdToNumber(createdBy?.userId);
  const updatedByUserId = actorUserIdToNumber(updatedBy?.userId);

  return {
    id: dashboardId,
    schemaVersion: CUSTOM_DASHBOARD_CURRENT_SCHEMA_VERSION,
    universeId,
    name: validateDashboardName(metadata.name ?? ''),
    description: validateDashboardDescription(metadata.description ?? undefined),
    status: toStatus(metadata),
    isPinned,
    pinnedAt: isPinned ? timestampToIso(metadata.pinnedTime) : undefined,
    createdAt,
    updatedAt,
    publishedAt,
    createdByUserId: createdByUserId ?? 0,
    // The API returns attribution ids without names. Rendering surfaces resolve
    // display names separately and apply their translated fallback when absent.
    createdByUsername: '',
    ...(updatedByUserId !== undefined
      ? {
          updatedByUserId,
        }
      : {}),
    config,
  };
}

export function fromApiDashboard(dashboard: ApiDashboard): CustomDashboardDocument {
  if (!dashboard.metadata) {
    throw new Error('Custom dashboard API response is missing metadata.');
  }
  return fromApiDashboardMetadata(dashboard.metadata, fromApiDashboardDocument(dashboard.document));
}
