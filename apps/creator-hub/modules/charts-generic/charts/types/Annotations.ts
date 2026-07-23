import type { ReactNode } from 'react';
import type { TRAQIV2Dimension, TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import type {
  TranslationKey,
  TranslationKeyAndTagsToFormattedReactNode,
} from '@modules/analytics-translations/types';
import type {
  AnnotationBenchmarkType,
  AnnotationType,
  AnnotationAlertType,
  AnnotationCreatorRegexOperation,
  AnnotationCustomMatchmakingChangeType,
  AnnotationEnablementType,
  AnnotationEngineReleasePlatform,
  RAQIV2QueryFilter,
} from '@modules/clients/analytics';
import type { NonEmptyArray } from '../../types/NonEmptyArray';

export type TAnnotationId = string & { _annotation: TAnnotationId };

/**
 * Centralised brand helper for `TAnnotationId`. The cast itself is unavoidable
 * for a string-brand, but funnelling it through a single typed helper keeps
 * the unsafe assertion in one well-named location instead of scattering
 * `as TAnnotationId` across callers.
 */
export const toAnnotationId = (id: string): TAnnotationId =>
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- branding a raw string into the TAnnotationId nominal type
  id as TAnnotationId;

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
  Minor = 'Minor',
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

type ExtendedServicesEnablementAnnotationContent = {
  type: AnnotationType.ExtendedServicesEnablement;
  service: string;
  resource: string;
  enabled: boolean;
  /**
   * Enablement tier for the transition. Combined with `enabled` this yields the
   * four annotation labels (Standard/Extended quota started/ended). Hydration
   * defaults to {@link AnnotationEnablementType.Extended} for annotations emitted
   * before the tier was introduced, preserving the original "extended quota" copy.
   */
  enablementType: AnnotationEnablementType;
};

type CreatorRegexChangeAnnotationContent = {
  type: AnnotationType.CreatorRegexChange;
  regexOperation: AnnotationCreatorRegexOperation;
};

/**
 * Range annotation derived from a user-configured alert that has fired
 * (`alertsGetAlertIncidents`). Carries the resolved UI `metric`, plus the
 * alert config's `filter` / `breakdown`, so per-chart filtering can decide
 * whether the incident is relevant to a given chart's slice of the data
 * (see `shouldShowConfiguredAlertIncident` in
 * `experience-analytics-shared/hooks/useChartTimeSeriesAnnotations.ts`).
 *
 * `isUnresolved` is true when the API returned no `resolvedAt`; the renderer
 * (`useTimeSeriesWebbloxAnnotations`) clamps `end` to the chart's time-axis
 * end in that case rather than using `endUtc`.
 */
type ConfiguredAlertIncidentAnnotationContent = {
  type: AnnotationType.ConfiguredAlertIncident;
  endUtc: Date;
  severity: AlertAnnotationSeverity;
  tooltipRenderer: (translateHTML: TranslationKeyAndTagsToFormattedReactNode) => ReactNode;
  metric: TRAQIV2UIMetric;
  alertId: string;
  alertName: string;
  isUnresolved: boolean;
  /** Refined alert-config filter rows (already restricted to RAQIV2 dimensions). */
  filter: readonly RAQIV2QueryFilter[];
  /** Refined alert-config breakdown dimensions. */
  breakdown: readonly TRAQIV2Dimension[];
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
    | ExtendedServicesEnablementAnnotationContent
    | CreatorRegexChangeAnnotationContent
    | ConfiguredAlertIncidentAnnotationContent
  );
