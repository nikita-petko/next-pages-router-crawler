import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import type {
  AnalyticsPageConfigAnnotationOptions,
  CreatorAnalyticsUntabbedPageConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const journeysDocLink: AnalyticsDocLink = '/docs/production/analytics/journey-events';

const journeysBasePageConfig: Pick<
  CreatorAnalyticsUntabbedPageConfig,
  | 'docLinks'
  | 'resourceTypes'
  | 'title'
  | 'description'
  | 'surfaceAnnotationOptions'
  | 'breakdownDimensions'
> = {
  docLinks: [journeysDocLink],
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  title: translationKey('Heading.Journeys', TranslationNamespace.Analytics),
  description: {
    standard: translationKey('Description.TakeActionJourneyEvents', TranslationNamespace.Analytics),
  },
  surfaceAnnotationOptions: {
    supportedAnnotationTypes: [AnnotationType.Announcement],
    defaultAnnotationTypes: [],
    showAnnotationsControl: false,
  } as const satisfies AnalyticsPageConfigAnnotationOptions,
  breakdownDimensions: [],
};

export default journeysBasePageConfig;
