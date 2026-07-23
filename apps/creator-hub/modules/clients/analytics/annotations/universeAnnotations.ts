import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { AnalyticsAnnotationsAPIApi, Annotation } from '@rbx/clients/analyticsAnnotationsApi/v1';
import {
  AssetsApi,
  V1AssetsGetFormatEnum,
  V1AssetsGetIsCircularEnum,
  V1AssetsGetReturnPolicyEnum,
  V1AssetsGetSizeEnum,
} from '@rbx/clients/thumbnails/v1';
import { getBEDEV1ServiceBasePath, getBEDEV2ServiceBasePath } from '../../utils';
import {
  AnnotationsClient,
  AnnotationType,
  getAnnotationsRequest,
  UIAnnotationTypeToApiAnnotation,
  TGenericAnnotationType,
} from './annotations';
import { ChartResourceType } from '../analyticsRAQIShared';

const UNINITIALIZED_UNIVERSE_ID = -1;
const ANNOTATIONS_PER_PAGE = 500;
const MAX_THUMBNAILS_PER_REQUEST = 100;
// eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
const THUMBNAILS_SIZE = V1AssetsGetSizeEnum._150x150;

const analyticsAnnotationsApi = new AnalyticsAnnotationsAPIApi(
  new Configuration({
    robloxSiteDomain: process.env.robloxSiteDomain,
    basePath: getBEDEV2ServiceBasePath('analytics-annotations'),
    credentials: 'include',
    unifiedLogger: unifiedLoggerClient,
  }),
);

const assetsApi = new AssetsApi(
  new Configuration({
    robloxSiteDomain: process.env.robloxSiteDomain,
    basePath: getBEDEV1ServiceBasePath('thumbnails'),
    credentials: 'include',
    unifiedLogger: unifiedLoggerClient,
  }),
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
    /* eslint-disable no-await-in-loop -- cursor-based paging */
    const response = await analyticsAnnotationsApi.v1UniversesUniverseIdAnnotationsGet(request);
    /* eslint-enable no-await-in-loop -- cursor-based paging */
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

  return responses.flat().reduce(
    (acc, curr) => {
      if (!curr.targetId || !curr.imageUrl) {
        return acc;
      }

      return { ...acc, [curr.targetId]: curr.imageUrl };
    },
    {} as { [assetId: number]: string },
  );
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
};

export type { Annotation };

export default universeAnnotationsClient;
