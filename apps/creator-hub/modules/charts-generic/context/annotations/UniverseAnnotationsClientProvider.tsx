import React, { createContext, FC, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AnnotationBenchmarkType,
  AnnotationType,
  TGenericAnnotationType,
  universeAnnotationsClient,
  AnnotationCustomMatchmakingChangeType,
  AnnotationEngineReleasePlatform,
} from '@modules/clients/analytics';
import type { getAnnotationsRequest } from '@modules/clients/analytics/annotations/annotations';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import {
  Annotation,
  CustomMatchmakingChange,
  EngineReleasePlatform,
  EventStateType,
  GamePreviewVideoStateType,
} from '@rbx/clients/analyticsAnnotationsApi/v1';
import {
  translationKey,
  type TranslationKeyToFormattedText,
} from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import logAnalyticsError from '../../utils/logAnalyticsError';
import { TAnnotationId, TimeSeriesAnnotation } from '../../charts/types/Annotations';
import { AnnotationsClientProviderState } from '../../types/AnnotationsClientProviderState';
import { isNonEmptyArray } from '../../types/NonEmptyArray';

export type UniverseAnnotationsClientProviderState = AnnotationsClientProviderState;

export const UniverseAnnotationsClientContext =
  createContext<UniverseAnnotationsClientProviderState | null>(null);

type SingleAssetAnnotationTypes = AnnotationType.PlaceIcon | AnnotationType.LiveEvent;

type MultipleAssetsAnnotationTypes = AnnotationType.PlaceThumbnail;

const annotationToAssetId = (
  annotation: Annotation,
  annotationType: SingleAssetAnnotationTypes,
): number => {
  switch (annotationType) {
    case AnnotationType.PlaceIcon:
      return annotation.metadata?.placeIcon?.iconAssetId ?? -1;
    case AnnotationType.LiveEvent:
      return annotation.metadata?.experienceEventState?.imageAssetId ?? -1;
    default: {
      const exhaustiveCheck: never = annotationType;
      throw new Error(`Retrieving asset ID from AnnotationType ${exhaustiveCheck} is unhandled`);
    }
  }
};

const annotationToAssetIds = (
  annotation: Annotation,
  annotationType: MultipleAssetsAnnotationTypes,
) => {
  switch (annotationType) {
    case AnnotationType.PlaceThumbnail:
      return annotation.metadata?.placeThumbnail?.thumbnailAssetIds ?? [];
    default: {
      const exhaustiveCheck: never = annotationType;
      throw new Error(`Retrieving asset IDs from AnnotationType ${exhaustiveCheck} is unhandled`);
    }
  }
};

export const UniverseAnnotationsClientProvider: FC<React.PropsWithChildren> = ({ children }) => {
  const queryClient = useQueryClient();

  const getCachedAnnotations = useCallback(
    async (request: getAnnotationsRequest): Promise<Annotation[]> => {
      const { annotationType, resource, placeId, rootPlaceId, funnelName, startUtc, endUtc } =
        request;

      const queryKey = [
        'annotations',
        'getAnnotations',
        annotationType,
        resource.type,
        resource.id,
        placeId ?? null,
        rootPlaceId ?? null,
        funnelName ?? null,
        startUtc.toISOString(),
        endUtc.toISOString(),
      ] as const;

      const annotations = await queryClient.ensureQueryData({
        queryKey,
        queryFn: () => universeAnnotationsClient.getAnnotations(request),
        staleTime: 60_000, // 60 seconds
      });

      return annotations;
    },
    [queryClient],
  );

  const hydrateAnnotations = useCallback(
    async (
      annotations: Annotation[],
      uiAnnotationType: TGenericAnnotationType,
      translate: TranslationKeyToFormattedText,
    ): Promise<TimeSeriesAnnotation[]> => {
      switch (uiAnnotationType) {
        case AnnotationType.PlaceIcon: {
          const assetIDs = annotations
            .map((annotation) => annotationToAssetId(annotation, uiAnnotationType))
            .filter((assetId) => assetId !== -1);
          const thumbnailsByAssetId = await universeAnnotationsClient.getIconThumbnails({
            iconAssetIds: assetIDs,
          });
          return annotations.map((annotation) => {
            const assetId = annotationToAssetId(annotation, uiAnnotationType);
            const imageUrl = thumbnailsByAssetId[assetId] ?? '';
            return {
              id: (annotation.id ?? '') as TAnnotationId,
              type: uiAnnotationType,
              startUtc: new Date(annotation.createdUtcTime ?? ''),
              imageUrl,
            };
          });
        }
        case AnnotationType.PlaceThumbnail: {
          // Map annotation id to its asset ids
          const assetIdsByAnnotation = new Map<string, number[]>();
          annotations.forEach((annotation) => {
            const id = annotation.id ?? '';
            const assetIds = annotationToAssetIds(annotation, uiAnnotationType).filter(
              (assetId: number) => assetId !== -1,
            );
            if (id && assetIds.length) {
              assetIdsByAnnotation.set(id, assetIds);
            }
          });

          // Aggregate all asset ids for fetching image urls
          const assetIDs = Array.from(new Set(Array.from(assetIdsByAnnotation.values()).flat()));
          if (assetIDs.length === 0) {
            return [];
          }
          const thumbnailsByAssetId = await universeAnnotationsClient.getIconThumbnails({
            iconAssetIds: assetIDs,
          });

          // Map retrieved image urls back to each annotation
          return annotations.reduce((accu: TimeSeriesAnnotation[], annotation) => {
            const assetIds = assetIdsByAnnotation.get(annotation.id ?? '') ?? [];
            const imageUrls = assetIds.map((assetId) => thumbnailsByAssetId[assetId] ?? '');
            if (isNonEmptyArray(imageUrls)) {
              accu.push({
                id: (annotation.id ?? '') as TAnnotationId,
                type: uiAnnotationType,
                startUtc: new Date(annotation.createdUtcTime ?? ''),
                imageUrls,
              });
            }
            return accu;
          }, []);
        }
        case AnnotationType.PlaceVideo: {
          return annotations
            .filter(
              (annotation) =>
                annotation.createdUtcTime &&
                annotation.metadata?.gamePreviewVideoStateChange?.gamePreviewVideoStateType &&
                annotation.metadata?.gamePreviewVideoStateChange?.universeId !== undefined &&
                annotation.metadata?.gamePreviewVideoStateChange?.gamePreviewVideoStateType ===
                  GamePreviewVideoStateType.Discoverable,
            )
            .map((annotation) => {
              const videoState = annotation.metadata?.gamePreviewVideoStateChange;
              return {
                id: (annotation.id ?? '') as TAnnotationId,
                type: AnnotationType.PlaceVideo,
                startUtc: new Date(annotation.createdUtcTime ?? ''),
                videoAssetId: videoState?.videoAssetId ?? -1,
                universeId: videoState?.universeId ?? -1,
              };
            });
        }
        case AnnotationType.PlaceVersion: {
          return annotations.map((annotation) => {
            const versionNumber = annotation.metadata?.placeVersion?.versionNumber;
            return {
              id: (annotation.id ?? '') as TAnnotationId,
              type: AnnotationType.PlaceVersion,
              startUtc: new Date(annotation.createdUtcTime ?? ''),
              text: `V${versionNumber}`,
            };
          });
        }
        case AnnotationType.Benchmark: {
          const validBenchmarkAnnotations: TimeSeriesAnnotation[] = [];
          annotations.forEach((annotation) => {
            const { id, createdUtcTime, metadata } = annotation;
            if (id && createdUtcTime) {
              const fromBenchmarkType = metadata?.benchmarkChange?.fromBenchmarkType;
              const from =
                fromBenchmarkType && isValidEnumValue(AnnotationBenchmarkType, fromBenchmarkType)
                  ? fromBenchmarkType
                  : null;
              const toBenchmarkType = metadata?.benchmarkChange?.toBenchmarkType;
              const to =
                toBenchmarkType && isValidEnumValue(AnnotationBenchmarkType, toBenchmarkType)
                  ? toBenchmarkType
                  : null;
              if (from && to) {
                validBenchmarkAnnotations.push({
                  id: id as TAnnotationId,
                  type: AnnotationType.Benchmark,
                  startUtc: new Date(createdUtcTime),
                  from,
                  to,
                });
              } else {
                logAnalyticsError(`Invalid benchmark annotation change type: ${from} to ${to}`);
              }
            }
          });
          return validBenchmarkAnnotations;
        }
        case AnnotationType.FunnelStepNameChange: {
          return annotations.reduce((acc: TimeSeriesAnnotation[], annotation) => {
            const minStep = annotation.metadata?.funnelStepNameChange?.minStep ?? 0;
            if (!annotation.id || !annotation.createdUtcTime) {
              return acc;
            }
            acc.push({
              id: annotation.id as TAnnotationId,
              type: AnnotationType.FunnelStepNameChange,
              startUtc: new Date(annotation.createdUtcTime),
              min_step: minStep,
            });
            return acc;
          }, []);
        }
        case AnnotationType.LiveEvent: {
          const assetIDs = annotations
            .map((annotation) => annotationToAssetId(annotation, uiAnnotationType))
            .filter((assetId) => assetId !== -1);
          const thumbnailsByAssetId = await universeAnnotationsClient.getIconThumbnails({
            iconAssetIds: assetIDs,
          });
          return annotations.reduce((acc: TimeSeriesAnnotation[], annotation) => {
            const { id, createdUtcTime, metadata } = annotation;
            if (!id || !createdUtcTime || !metadata?.experienceEventState) {
              return acc;
            }
            const { imageAssetId, eventName, eventStateType, eventId } =
              metadata.experienceEventState;
            // filter out invalid events
            if (!eventId || !eventName || eventStateType === EventStateType.Invalid) {
              return acc;
            }
            acc.push({
              id: id as TAnnotationId,
              type: AnnotationType.LiveEvent,
              startUtc: new Date(createdUtcTime),
              imageUrl: imageAssetId ? thumbnailsByAssetId[imageAssetId] : undefined,
              eventName,
              eventId: `${eventId}`,
              eventType: eventStateType === EventStateType.EventStart ? 'start' : 'end',
            });
            return acc;
          }, []);
        }
        case AnnotationType.CustomMatchmaking: {
          return annotations.reduce((acc: TimeSeriesAnnotation[], annotation) => {
            const { id, createdUtcTime, metadata } = annotation;
            if (!id || !createdUtcTime || !metadata?.customMatchmaking) {
              return acc;
            }
            const { stateChange, scoringConfigurationName } = metadata.customMatchmaking;
            let customMatchmakingChange: AnnotationCustomMatchmakingChangeType =
              AnnotationCustomMatchmakingChangeType.Enrollment;
            // filter out invalid events
            switch (stateChange) {
              case CustomMatchmakingChange.Enrollment:
                customMatchmakingChange = AnnotationCustomMatchmakingChangeType.Enrollment;
                break;
              case CustomMatchmakingChange.Unenrollment:
                customMatchmakingChange = AnnotationCustomMatchmakingChangeType.Unenrollment;
                break;
              case CustomMatchmakingChange.TypeWeightsUpdate:
                customMatchmakingChange = AnnotationCustomMatchmakingChangeType.WeightsUpdate;
                break;
              default: {
                throw new Error(`Unhandled custom matchmaking change type: ${stateChange}`);
              }
            }
            acc.push({
              id: annotation.id as TAnnotationId,
              type: AnnotationType.CustomMatchmaking,
              startUtc: new Date(createdUtcTime),
              scoringConfigurationName: scoringConfigurationName ?? '',
              customMatchmakingChange,
            });
            return acc;
          }, []);
        }
        case AnnotationType.ConfigVersion: {
          return annotations.map((annotation) => {
            const versionNumber = annotation.metadata?.configChange?.version;
            return {
              id: (annotation.id ?? '') as TAnnotationId,
              type: AnnotationType.ConfigVersion,
              startUtc: new Date(annotation.createdUtcTime ?? ''),
              text: translate(
                translationKey('Label.Annotation.ConfigVersion', TranslationNamespace.Analytics),
                {
                  version: `V${versionNumber ?? '?'}`,
                },
              ),
              version: versionNumber,
            };
          });
        }
        case AnnotationType.EngineRelease: {
          return annotations.map((annotation) => {
            const engineReleasePlatform =
              annotation.metadata?.engineRelease?.platform ?? EngineReleasePlatform.Invalid;
            let platform: AnnotationEngineReleasePlatform;
            const releaseMajorVersion =
              annotation.metadata?.engineRelease?.releaseMajorVersion ?? 0;
            switch (engineReleasePlatform) {
              case EngineReleasePlatform.Rcc:
                platform = AnnotationEngineReleasePlatform.Rcc;
                break;
              case EngineReleasePlatform.WindowsPlayer:
                platform = AnnotationEngineReleasePlatform.WindowsPlayer;
                break;
              case EngineReleasePlatform.MacPlayer:
                platform = AnnotationEngineReleasePlatform.MacPlayer;
                break;
              default:
                throw new Error(`Invalid Engine Release platform: ${engineReleasePlatform}`);
            }

            return {
              id: (annotation.id ?? '') as TAnnotationId,
              type: AnnotationType.EngineRelease,
              startUtc: new Date(annotation.createdUtcTime ?? ''),
              platform,
              releaseMajorVersion,
            };
          });
        }
        // -- ADD HYDRATION FOR NEW ANNOTATION TYPES ABOVE THIS LINE --
        default: {
          const exhaustiveCheck: never = uiAnnotationType;
          throw new Error(`Unknown AnnotationType: ${exhaustiveCheck}`);
        }
      }
    },
    [],
  );

  const value = useMemo(() => {
    return {
      annotationsClient: {
        ...universeAnnotationsClient,
        getAnnotations: getCachedAnnotations,
        hydrateAnnotations,
      },
    };
  }, [getCachedAnnotations, hydrateAnnotations]);

  return (
    <UniverseAnnotationsClientContext.Provider value={value}>
      {children}
    </UniverseAnnotationsClientContext.Provider>
  );
};
