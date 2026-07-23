import { ReactNode } from 'react';
import {
  AnnotationBenchmarkType,
  AnnotationType,
  AnnotationAlertType,
  AnnotationCustomMatchmakingChangeType,
  AnnotationEngineReleasePlatform,
} from '@modules/clients/analytics';
import {
  TranslationKey,
  TranslationKeyAndTagsToFormattedReactNode,
} from '@modules/analytics-translations';
import { NonEmptyArray } from '../../types/NonEmptyArray';

export type TAnnotationId = string & { _annotation: TAnnotationId };

type PlaceVersionAnnotationContent = {
  type: AnnotationType.PlaceVersion;
  text: string;
};

type IconAnnotationContent = {
  type: AnnotationType.PlaceIcon;
  imageUrl: string;
};

type ThumbnailAnnotationContent = {
  type: AnnotationType.PlaceThumbnail;
  imageUrls: NonEmptyArray<string>;
};

type BenchmarkAnnotationContent = {
  type: AnnotationType.Benchmark;
  from: AnnotationBenchmarkType;
  to: AnnotationBenchmarkType;
};

type FunnelStepNameChangeAnnotationContent = {
  type: AnnotationType.FunnelStepNameChange;
  min_step: number;
};

type LiveEventAnnotationContent = {
  type: AnnotationType.LiveEvent;
  eventName: string;
  eventType: 'start' | 'end';
  eventId: string;
  imageUrl?: string;
};

type ForwardLookingRetentionAnnotationContent = {
  type: AnnotationType.RetentionCorhortDisclaimer;
  endUtc: Date;
};

type CustomMatchmakingAnnotationContent = {
  type: AnnotationType.CustomMatchmaking;
  scoringConfigurationName: string;
  customMatchmakingChange: AnnotationCustomMatchmakingChangeType;
};

type EngineReleaseAnnotationContent = {
  type: AnnotationType.EngineRelease;
  platform: AnnotationEngineReleasePlatform;
  releaseMajorVersion: number;
};

type CommonAnnotationContent = {
  // Unique ID associated with each annotation
  id: TAnnotationId;
  // Timestamp for when the annotation begins (and for single point annotation, this is the annotation creation time)
  startUtc: Date;
};

export enum AlertAnnotationSeverity {
  Error = 'Error',
  Warning = 'Warning',
  Info = 'Info',
}

type AlertAnnotationContent = {
  type: AnnotationAlertType;
  endUtc: Date;
  tooltipRenderer: (translateHTML: TranslationKeyAndTagsToFormattedReactNode) => ReactNode;
  severity: AlertAnnotationSeverity;
  priority: number;
};

type PlaceVideoAnnotationContent = {
  type: AnnotationType.PlaceVideo;
  videoAssetId: number;
  universeId: number;
};

type ConfigVersionAnnotationContent = {
  type: AnnotationType.ConfigVersion;
  text: string;
  /** Version number for deep linking to history page. May be undefined if metadata is missing. */
  version?: number;
};

type AnnouncementAnnotationContent = {
  type: AnnotationType.Announcement;
  translationKey: TranslationKey;
  links: string[];
};

// TimeSeriesAnnotations are meant to be used within time series charts.
export type TimeSeriesAnnotation = {
  type: AnnotationType;
} & CommonAnnotationContent &
  (
    | PlaceVersionAnnotationContent
    | IconAnnotationContent
    | ThumbnailAnnotationContent
    | BenchmarkAnnotationContent
    | FunnelStepNameChangeAnnotationContent
    | LiveEventAnnotationContent
    | CustomMatchmakingAnnotationContent
    | EngineReleaseAnnotationContent
    | ForwardLookingRetentionAnnotationContent
    | AlertAnnotationContent
    | PlaceVideoAnnotationContent
    | ConfigVersionAnnotationContent
    | AnnouncementAnnotationContent
  );
