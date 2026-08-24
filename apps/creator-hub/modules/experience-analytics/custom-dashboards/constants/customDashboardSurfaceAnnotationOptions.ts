import { AnnotationType } from '@modules/clients/analytics/annotations/annotations';
import type { AnalyticsPageConfigAnnotationOptions } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';

/**
 * Annotation types the custom-dashboard surface can offer. The backend proto
 * only persists `defaultAnnotationTypeKeys` (the selected subset), so callers
 * must derive this catalog at runtime instead of reconstructing it from saved
 * defaults.
 */
export const CUSTOM_DASHBOARD_SURFACE_ANNOTATION_OPTIONS: AnalyticsPageConfigAnnotationOptions = {
  supportedAnnotationTypes: [
    AnnotationType.PlaceIcon,
    AnnotationType.PlaceThumbnail,
    AnnotationType.PlaceVideo,
    AnnotationType.PlaceVersion,
    AnnotationType.Benchmark,
    AnnotationType.LiveEvent,
    AnnotationType.CustomMatchmaking,
    AnnotationType.RetentionCorhortDisclaimer,
    AnnotationType.ConfigVersion,
    AnnotationType.Announcement,
  ],
  defaultAnnotationTypes: [],
  showAnnotationsControl: true,
};

export function resolveCustomDashboardSupportedAnnotationTypes(
  selectedDefaults: ReadonlyArray<AnnotationType> = [],
): AnnotationType[] {
  const available = CUSTOM_DASHBOARD_SURFACE_ANNOTATION_OPTIONS.supportedAnnotationTypes;
  const extraSelected = selectedDefaults.filter((type) => !available.includes(type));
  return extraSelected.length === 0 ? [...available] : [...available, ...extraSelected];
}
