import { DateRangeType, AnalyticsDocLink } from '@modules/charts-generic';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import React, { FC } from 'react';
import { translationKey } from '@modules/analytics-translations';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import {
  CreatorAnalyticsLayout,
  RAQIV2SpecialLayoutType,
  CreatorAnalyticsPageMode,
  CreatorAnalyticsUntabbedPageConfig,
} from '@modules/experience-analytics-shared';
import { PageLoading } from '@modules/miscellaneous/common';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import {
  analyticsComponentConfigPlayerFeedbackSummary,
  analyticsComponentConfigPlayerFeedbackTable,
  analyticsComponentConfigPlayerFeedbackVotesCountChart,
} from './analyticsComponentWrapperConfigs';

const feedbackDocLink: AnalyticsDocLink = '/docs/production/analytics/feedback';

const playerFeedbackPageConfig: CreatorAnalyticsUntabbedPageConfig = {
  mode: CreatorAnalyticsPageMode.Untabbed,
  debugPageName: 'Feedback',
  docLinks: [feedbackDocLink],
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  title: translationKey('Heading.Feedback', TranslationNamespace.PlayerFeedback),
  description: {
    standard: translationKey(
      'Description.TakeActionFeedbackSubtitle',
      TranslationNamespace.PlayerFeedback,
    ),
  },
  granularity: { fixed: RAQIV2MetricGranularity.OneDay },
  timeRangeOptions: {
    type: 'dateRange',
    supportedRanges: [
      DateRangeType.Last7Days,
      DateRangeType.Last28Days,
      DateRangeType.Last56Days,
      DateRangeType.Last90Days,
      DateRangeType.Custom,
    ],
    defaultRange: DateRangeType.Last28Days,
    maxStartDateOffsetDays: 365,
    excludeEndDateInRange: false,
    maxEndDateOffset: 0,
  },
  surfaceAnnotationOptions: {
    supportedAnnotationTypes: [
      AnnotationType.PlaceVideo,
      AnnotationType.PlaceVersion,
      AnnotationType.PlaceThumbnail,
      AnnotationType.LiveEvent,
      AnnotationType.ConfigVersion,
      AnnotationType.Announcement,
    ],
    defaultAnnotationTypes: [],
    showAnnotationsControl: true,
  },
  filterDimensions: [],
  breakdownDimensions: [],
  body: [
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [
        analyticsComponentConfigPlayerFeedbackSummary,
        analyticsComponentConfigPlayerFeedbackVotesCountChart,
        analyticsComponentConfigPlayerFeedbackTable,
      ],
    },
  ],
  hideHeroDivider: true,
};
const PlayerFeedbackPageContainer: FC = () => {
  const { userCanViewAnalyticsForUniverse, isFetched: isAnalyticsFlagsFetched } =
    useFeatureFlagsForNamespace('userCanViewAnalyticsForUniverse', FeatureFlagNamespace.Analytics);

  const { settings, isFetched: settingsFetched } = useSettings();

  if (!isAnalyticsFlagsFetched || !settingsFetched) {
    return <PageLoading />;
  }
  if (!userCanViewAnalyticsForUniverse || !settings?.enablePlayerFeedback) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }
  return <CreatorAnalyticsLayout config={playerFeedbackPageConfig} />;
};
export default withTranslation(PlayerFeedbackPageContainer, [TranslationNamespace.PlayerFeedback]);
