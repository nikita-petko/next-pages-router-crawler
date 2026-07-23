import { AlertsApi } from '@rbx/client-analytics-alert-control-plane/v1';
import type { Annotation } from '@rbx/client-analytics-annotations-api/v1';
import { AnalyticsAnnotationsAPIApi } from '@rbx/client-analytics-annotations-api/v1';
import {
  AssetsApi,
  V1AssetsGetFormatEnum,
  V1AssetsGetIsCircularEnum,
  V1AssetsGetReturnPolicyEnum,
  V1AssetsGetSizeEnum,
} from '@rbx/client-thumbnails/v1';
import { createClientConfiguration } from '../../utils/createClientConfiguration';
import { parseSdkIncidentDetail } from '../analyticsAlertControlPlane';
import { ChartResourceType } from '../analyticsRAQIShared';
import type {
  AnnotationsClient,
  CustomAlertAnnotationItem,
  GetCustomAlertAnnotationRequest,
  getAnnotationsRequest,
  TGenericAnnotationType,
} from './annotations';
import { AnnotationType, UIAnnotationTypeToApiAnnotation } from './annotations';

const UNINITIALIZED_UNIVERSE_ID = -1;
const ANNOTATIONS_PER_PAGE = 500;
const MAX_THUMBNAILS_PER_REQUEST = 100;
// eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
const THUMBNAILS_SIZE = V1AssetsGetSizeEnum._150x150;

const analyticsAnnotationsApi = new AnalyticsAnnotationsAPIApi(
  createClientConfiguration('analytics-annotations', 'bedev2'),
);

const assetsApi = new AssetsApi(createClientConfiguration('thumbnails', 'bedev1'));

const analyticsAlertControlPlaneApi = new AlertsApi(
  createClientConfiguration('analytics-alert-control-plane', 'bedev2'),
);

export const getAnnotations = async ({
  annotationType,
  resource,
  placeId,
  rootPlaceId,
  funnelName,
  startUtc,
  endUtc,
}: getAnnotationsRequest) => {
  const annotations: Annotation[] = [];
  const { id: universeId, type } = resource;

  if (universeId === UNINITIALIZED_UNIVERSE_ID) {
    return [];
  }

  if (type !== ChartResourceType.Universe) {
    throw new Error(
      `should not fetch universe annotations with a non universe resource type: ${type}`,
    );
  }

  const config: Record<
    TGenericAnnotationType,
    { allowPlaceId: boolean; allowFunnelName: boolean }
  > = {
    // benchmark change, live event are associated with experience only
    [AnnotationType.Benchmark]: {
      allowPlaceId: false,
      allowFunnelName: false,
    },
    [AnnotationType.LiveEvent]: {
      allowPlaceId: false,
      allowFunnelName: false,
    },
    // place thumbnail doesn't need to include root place id
    [AnnotationType.PlaceThumbnail]: {
      allowPlaceId: rootPlaceId !== placeId,
      allowFunnelName: false,
    },
    [AnnotationType.PlaceVideo]: {
      allowPlaceId: false,
      allowFunnelName: false,
    },
    // funnel step name change is associated with funnel name
    [AnnotationType.FunnelStepNameChange]: {
      allowPlaceId: false,
      allowFunnelName: true,
    },
    [AnnotationType.PlaceIcon]: {
      allowPlaceId: true,
      allowFunnelName: false,
    },
    [AnnotationType.PlaceVersion]: {
      allowPlaceId: true,
      allowFunnelName: false,
    },
    [AnnotationType.CustomMatchmaking]: {
      allowPlaceId: false,
      allowFunnelName: false,
    },
    [AnnotationType.ConfigVersion]: {
      allowPlaceId: false,
      allowFunnelName: false,
    },
    [AnnotationType.EngineRelease]: {
      allowPlaceId: false,
      allowFunnelName: false,
    },
    [AnnotationType.ExtendedServicesEnablement]: {
      allowPlaceId: false,
      allowFunnelName: false,
    },
    [AnnotationType.CreatorRegexChange]: {
      allowPlaceId: false,
      allowFunnelName: false,
    },
  };

  const { allowPlaceId, allowFunnelName } = config[annotationType];

  // We paginate through all pages and return a single list to the caller.
  let cursor = '';
  do {
    const request = {
      annotationType: UIAnnotationTypeToApiAnnotation[annotationType],
      universeId,
      // benchmark change and live event is associated with experience only, so we drop placeId for benchmark annotations
      placeId: allowPlaceId ? placeId : undefined,
      inclusiveStartUtcTime: startUtc.toISOString(),
      inclusiveEndUtcTime: endUtc.toISOString(),
      funnelName: allowFunnelName ? funnelName : undefined,
      cursor,
      reverse: false,
      resultsPerPage: annotationType === AnnotationType.PlaceVersion ? 100 : ANNOTATIONS_PER_PAGE,
    };

    // We need to depend on the cursor returned from the current page before we move on to the next
    const response = await analyticsAnnotationsApi.v1UniversesUniverseIdAnnotationsGet(request);
    annotations.push(...(response.annotations ?? []));
    cursor = response.nextCursor ?? '';
  } while (cursor);

  return annotations;
};

export const getIconThumbnails = async ({
  iconAssetIds,
}: {
  iconAssetIds: number[];
}): Promise<{ [assetId: number]: string }> => {
  if (iconAssetIds.length === 0) {
    return {};
  }

  // Chunk the asset IDs by groups of 100, which is the maximum size defined in Roblox.Thumbnails.Api
  const chunks = [];
  for (let i = 0; i < iconAssetIds.length; i += MAX_THUMBNAILS_PER_REQUEST) {
    const chunk = iconAssetIds.slice(i, i + MAX_THUMBNAILS_PER_REQUEST);
    chunks.push(chunk);
  }

  const responses = await Promise.all(
    chunks.map(async (chunk) => {
      const request = {
        assetIds: chunk,
        returnPolicy: V1AssetsGetReturnPolicyEnum.PlaceHolder,
        size: THUMBNAILS_SIZE as V1AssetsGetSizeEnum,
        format: V1AssetsGetFormatEnum.Webp,
        isCircular: V1AssetsGetIsCircularEnum.False,
      };
      const response = await assetsApi.v1AssetsGet(request);

      return response.data ?? [];
    }),
  );

  const result: { [assetId: number]: string } = {};
  for (const item of responses.flat()) {
    if (item.targetId && item.imageUrl) {
      result[item.targetId] = item.imageUrl;
    }
  }
  return result;
};

export const getCustomAlertAnnotation = async ({
  resource,
  startUtc,
  endUtc,
}: GetCustomAlertAnnotationRequest): Promise<CustomAlertAnnotationItem[]> => {
  if (resource.type !== ChartResourceType.Universe) {
    return [];
  }
  if (!Number.isFinite(resource.id) || resource.id <= 0) {
    return [];
  }

  const incidents = await analyticsAlertControlPlaneApi.alertsGetAlertIncidents({
    resourceType: ChartResourceType.Universe,
    resourceId: String(resource.id),
    startTime: startUtc,
    endTime: endUtc,
  });

  // Lift the SDK's nested `alertConfig` block to top-level fields so we read
  // from the new authoritative source (analytics-alerts PR #54). We stop at
  // the raw lift (no `refineRawAlertConfigFields`): the configured-alert
  // incident annotation adapter runs its own metric/severity normalization
  // and tolerates unknown values, while `refineRawAlertConfigFields` would
  // throw the entire incident on any unknown enum.
  return incidents.map(parseSdkIncidentDetail).map((incident) => ({
    incidentId: incident.id,
    alertId: incident.alertId,
    alertName: incident.alertName,
    metric: incident.metric,
    severity: incident.severity,
    description: incident.description,
    interval: incident.interval,
    // Window-aligned bounds; precise opened/resolved timestamps stay on the
    // full incident detail for the alert history table.
    startUtc: incident.openedWindowStartAt,
    endUtc: incident.resolvedWindowStartAt,
    filter: incident.filter,
    breakdown: incident.breakdown,
    condition: incident.condition,
  }));
};

export type UniverseAnnotationsClient = AnnotationsClient & {
  // Returns the associated thumbnail URLs for a list of icon asset IDs.
  getIconThumbnails: (request: {
    iconAssetIds: number[];
  }) => Promise<{ [assetId: number]: string }>;
};

const universeAnnotationsClient: UniverseAnnotationsClient = {
  getAnnotations,
  getIconThumbnails,
  getCustomAlertAnnotation,
};

export type { Annotation };

export default universeAnnotationsClient;
