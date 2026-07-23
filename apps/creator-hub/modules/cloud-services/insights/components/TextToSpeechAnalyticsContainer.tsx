import { DateRangeType, AnalyticsDocLink } from '@modules/charts-generic';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import React, { FunctionComponent } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import {
  AnalyticsPageConfigAnnotationOptions,
  CreatorAnalyticsLayout,
  CreatorAnalyticsPageMode,
  CreatorAnalyticsUntabbedPageConfig,
  RAQIV2SpecialLayoutType,
} from '@modules/experience-analytics-shared';
import { translationKey } from '@modules/analytics-translations';
import { RAQIV2Dimension, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
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
      DateRangeType.Last1Hour,
      DateRangeType.Last1Day,
      DateRangeType.Last7Days,
      DateRangeType.Custom,
    ],
    defaultRange: DateRangeType.Last1Day,
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
