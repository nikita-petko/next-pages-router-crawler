import {
  Annotation,
  AnnotationType as SwaggerAnnotationType,
} from '@rbx/clients/analyticsAnnotationsApi/v1';
import { ChartResource } from '../analyticsRAQIShared';

export enum AnnotationType {
  PlaceIcon = 'PlaceIcon',
  PlaceThumbnail = 'PlaceThumbnail',
  PlaceVideo = 'PlaceVideo',
  PlaceVersion = 'PlaceVersion',
  Benchmark = 'Benchmark',
  FunnelStepNameChange = 'FunnelStepNameChange',
  LiveEvent = 'LiveEvent',
  CustomMatchmaking = 'CustomMatchmaking',
  EngineRelease = 'EngineRelease',
  MemoryStoreMemoryUsageAlert = 'MemoryStoreMemoryUsageAlert',
  MemoryStoreRequestsAlert = 'MemoryStoreRequestsAlert',
  ClientCrashRateNotStableAlert = 'ClientCrashRateNotStableAlert',
  RetentionCorhortDisclaimer = 'RetentionCorhortDisclaimer',
  ConfigVersion = 'ConfigVersion',
  Announcement = 'Announcement',
}

export type AnnotationAlertType =
  | AnnotationType.MemoryStoreMemoryUsageAlert
  | AnnotationType.MemoryStoreRequestsAlert
  | AnnotationType.ClientCrashRateNotStableAlert;

export const isAnnotationAlertType = (
  annotationType: AnnotationType,
): annotationType is AnnotationAlertType => {
  return (
    annotationType === AnnotationType.MemoryStoreMemoryUsageAlert ||
    annotationType === AnnotationType.MemoryStoreRequestsAlert ||
    annotationType === AnnotationType.ClientCrashRateNotStableAlert
  );
};

export type TGenericAnnotationType = Exclude<
  AnnotationType,
  AnnotationAlertType | AnnotationType.RetentionCorhortDisclaimer | AnnotationType.Announcement
>;

// NOTE(@bxu - 10/3/2023): Define a mirror of AnnotationType because the gRPC transcoded Swagger document returns
// numbers instead.
export const UIAnnotationTypeToApiAnnotation: Record<
  TGenericAnnotationType,
  SwaggerAnnotationType
> = {
  [AnnotationType.PlaceIcon]: SwaggerAnnotationType.NUMBER_1,
  [AnnotationType.PlaceThumbnail]: SwaggerAnnotationType.NUMBER_4,
  [AnnotationType.PlaceVersion]: SwaggerAnnotationType.NUMBER_5,
  [AnnotationType.Benchmark]: SwaggerAnnotationType.NUMBER_6,
  [AnnotationType.FunnelStepNameChange]: SwaggerAnnotationType.NUMBER_7,
  [AnnotationType.LiveEvent]: SwaggerAnnotationType.NUMBER_8,
  [AnnotationType.CustomMatchmaking]: SwaggerAnnotationType.NUMBER_9,
  [AnnotationType.EngineRelease]: SwaggerAnnotationType.NUMBER_10,
  [AnnotationType.PlaceVideo]: SwaggerAnnotationType.NUMBER_11,
  [AnnotationType.ConfigVersion]: SwaggerAnnotationType.NUMBER_12,
};

export enum AnnotationBenchmarkType {
  Similarity = 'SIMILARITY',
  Genre = 'GENRE',
}

export enum AnnotationCustomMatchmakingChangeType {
  Enrollment = 'Enrollment',
  Unenrollment = 'Unenrollment',
  WeightsUpdate = 'WeightsUpdate',
}

export enum AnnotationEngineReleasePlatform {
  Rcc = 'RCC',
  WindowsPlayer = 'WindowsPlayer',
  MacPlayer = 'MacPlayer',
}

export type getAnnotationsRequest = {
  annotationType: keyof typeof UIAnnotationTypeToApiAnnotation;
  resource: ChartResource;
  placeId?: number;
  rootPlaceId?: number;
  funnelName?: string;
  startUtc: Date;
  endUtc: Date;
};

export type AnnotationsClient = {
  /**
   * Returns annotations for a specific type. We iterate through all pFages within the client method, and returns as
   * a single list.
   */
  getAnnotations(request: getAnnotationsRequest): Promise<Annotation[]>;
};

export type { Annotation };
