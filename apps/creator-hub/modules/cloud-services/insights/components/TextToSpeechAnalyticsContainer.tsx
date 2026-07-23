import type { FunctionComponent } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { withTranslation } from '@rbx/intl';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import type {
  AnalyticsPageConfigAnnotationOptions,
  CreatorAnalyticsUntabbedPageConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { CreatorAnalyticsPageMode } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  chartConfigRawAudioErrors,
  chartConfigRawAudioSuccesses,
} from './textToSpeechChartConfigs';

const textToSpeechDocLink: AnalyticsDocLink = '/docs/reference/engine/classes/AudioTextToSpeech';

const pageConfig: CreatorAnalyticsUntabbedPageConfig = {
  mode: CreatorAnalyticsPageMode.Untabbed,
  debugPageName: 'TextToSpeech',
  docLinks: [textToSpeechDocLink],
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  title: translationKey('Heading.TextToSpeech', TranslationNamespace.Analytics),
  description: {
    standard: translationKey('Description.TextToSpeech', TranslationNamespace.Analytics),
  },
  granularity: {
    options: [
      RAQIV2MetricGranularity.HalfHour,
      RAQIV2MetricGranularity.OneHour,
      RAQIV2MetricGranularity.OneDay,
      RAQIV2MetricGranularity.OneMinute,
    ],
  },
  filterDimensions: [RAQIV2Dimension.TextToSpeechRawAudioStatus],
  breakdownDimensions: [],
  body: [
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [chartConfigRawAudioSuccesses],
    },
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [chartConfigRawAudioErrors],
    },
  ],
  timeRangeOptions: {
    type: 'dateRange',
    supportedRanges: [
      RAQIV2DateRangeType.Last1Hour,
      RAQIV2DateRangeType.Last1Day,
      RAQIV2DateRangeType.Last7Days,
      RAQIV2DateRangeType.Custom,
    ],
    defaultRange: RAQIV2DateRangeType.Last1Day,
  },
  surfaceAnnotationOptions: {
    supportedAnnotationTypes: [
      AnnotationType.PlaceIcon,
      AnnotationType.PlaceThumbnail,
      AnnotationType.PlaceVideo,
      AnnotationType.PlaceVersion,
      AnnotationType.LiveEvent,
      AnnotationType.ConfigVersion,
      AnnotationType.Announcement,
    ],
    defaultAnnotationTypes: [],
    showAnnotationsControl: false,
  } as const satisfies AnalyticsPageConfigAnnotationOptions,
  hideHeroDivider: false,
};
const TextToSpeechAnalyticsContainer: FunctionComponent = () => {
  return <CreatorAnalyticsLayout config={pageConfig} />;
};

export default withTranslation(TextToSpeechAnalyticsContainer, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.CloudServices,
]);
