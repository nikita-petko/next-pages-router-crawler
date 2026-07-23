import type { FC } from 'react';
import { StatusCodes } from '@rbx/core';
import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { withTranslation } from '@rbx/intl';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import {
  CreatorAnalyticsPageMode,
  type CreatorAnalyticsUntabbedPageConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
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
      RAQIV2DateRangeType.Last7Days,
      RAQIV2DateRangeType.Last28Days,
      RAQIV2DateRangeType.Last56Days,
      RAQIV2DateRangeType.Last90Days,
      RAQIV2DateRangeType.Custom,
    ],
    defaultRange: RAQIV2DateRangeType.Last28Days,
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
  const { id: universeId } = useUniverseResource();
  const { userCanViewAnalyticsForUniverse, isPending: isPendingAnalyticsExperiencePermissions } =
    useAnalyticsExperiencePermissions(universeId);

  const { settings, isFetched: settingsFetched } = useSettings();

  if (isPendingAnalyticsExperiencePermissions || !settingsFetched) {
    return <PageLoading />;
  }
  if (!userCanViewAnalyticsForUniverse || !settings?.enablePlayerFeedback) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }
  return <CreatorAnalyticsLayout config={playerFeedbackPageConfig} />;
};
export default withTranslation(PlayerFeedbackPageContainer, [TranslationNamespace.PlayerFeedback]);
