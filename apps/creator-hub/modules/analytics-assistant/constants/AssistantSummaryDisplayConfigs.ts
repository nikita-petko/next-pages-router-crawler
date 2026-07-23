import {
  type AnalyticsNavigationItem,
  analyticsCreationOverviewNavigationItem,
  analyticsRetentionNavigationItem,
  analyticsFeedbackNavigationItem,
} from '@modules/charts-generic';
import { translationKey, TranslationKey } from '@modules/analytics-translations';
import { ComponentPropsWithoutRef } from 'react';
import { BarChartIcon } from '@rbx/ui';
import { InsightTypeV2 } from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { TAssistantSummaryInsight } from '../types/AssistantSummaryInsightType';
import AnalyticsAssistantVoteOptions from '../types/AnalyticsAssistantVoteOptions';

type IconProps = ComponentPropsWithoutRef<typeof BarChartIcon>;

const DEFAULT_UPVOTE_OPTIONS = [
  {
    translationKey: translationKey(
      'Feedback.Label.IdentifyNextAction',
      TranslationNamespace.AnalyticsAssistant,
    ),
    value: AnalyticsAssistantVoteOptions.UpvoteIdentifyNextAction,
  },
  {
    translationKey: translationKey(
      'Feedback.Label.Understanding',
      TranslationNamespace.AnalyticsAssistant,
    ),
    value: AnalyticsAssistantVoteOptions.UpvoteUnderstanding,
  },
  {
    translationKey: translationKey(
      'Feedback.Label.SaveTime',
      TranslationNamespace.AnalyticsAssistant,
    ),
    value: AnalyticsAssistantVoteOptions.UpvoteSaveTime,
  },
  {
    translationKey: translationKey('Feedback.Label.Other', TranslationNamespace.AnalyticsAssistant),
    value: AnalyticsAssistantVoteOptions.UpvoteOther,
  },
];

const DEFAULT_DOWNVOTE_OPTIONS = [
  {
    translationKey: translationKey(
      'Feedback.Label.InaccurateData',
      TranslationNamespace.AnalyticsAssistant,
    ),
    value: AnalyticsAssistantVoteOptions.DownvoteInaccurateData,
  },
  {
    translationKey: translationKey(
      'Feedback.Label.NotHelpful',
      TranslationNamespace.AnalyticsAssistant,
    ),
    value: AnalyticsAssistantVoteOptions.DownvoteNotHelpful,
  },
  {
    translationKey: translationKey(
      'Feedback.Label.NotRelevant',
      TranslationNamespace.AnalyticsAssistant,
    ),
    value: AnalyticsAssistantVoteOptions.DownvoteNotRelevant,
  },
  {
    translationKey: translationKey('Feedback.Label.Other', TranslationNamespace.AnalyticsAssistant),
    value: AnalyticsAssistantVoteOptions.DownvoteOther,
  },
];

const PLAYER_FEEDBACK_DOWNVOTE_OPTIONS = [
  {
    translationKey: translationKey(
      'Feedback.Label.InaccurateComments',
      TranslationNamespace.AnalyticsAssistant,
    ),
    value: AnalyticsAssistantVoteOptions.DownvoteInaccurateComments,
  },
  {
    translationKey: translationKey(
      'Feedback.Label.MissingImportantComments',
      TranslationNamespace.AnalyticsAssistant,
    ),
    value: AnalyticsAssistantVoteOptions.DownvoteMissingImportantComments,
  },
  ...DEFAULT_DOWNVOTE_OPTIONS.filter(
    (option) =>
      option.value !== AnalyticsAssistantVoteOptions.DownvoteInaccurateData &&
      option.value !== AnalyticsAssistantVoteOptions.DownvoteNotRelevant,
  ),
];

export type FeedbackOption = {
  translationKey: TranslationKey;
  value: AnalyticsAssistantVoteOptions;
};

type AssistantSummaryDisplayConfig = {
  prevPage: AnalyticsNavigationItem;
  summary: {
    titleKey: TranslationKey;
    titleChipKey?: TranslationKey;
  };
  canvas: {
    titleKey: TranslationKey;
    titleIcon: React.FC<IconProps>;
  };
  feedback: {
    upvoteOptions: FeedbackOption[];
    downvoteOptions: FeedbackOption[];
  };
  insight?: {
    titleKey: TranslationKey;
  };
  preloadCanvasSections?: boolean;
};

export const AssistantSummaryDisplayConfigs: Record<
  TAssistantSummaryInsight,
  AssistantSummaryDisplayConfig
> = {
  [InsightTypeV2.SummaryReport]: {
    prevPage: analyticsCreationOverviewNavigationItem,
    summary: {
      titleKey: translationKey('Heading.Assistant', TranslationNamespace.AnalyticsAssistant),
      titleChipKey: translationKey('Label.Beta', TranslationNamespace.AnalyticsAssistant),
    },
    canvas: {
      titleKey: translationKey('Label.Charts', TranslationNamespace.AnalyticsAssistant),
      titleIcon: BarChartIcon,
    },
    feedback: {
      upvoteOptions: DEFAULT_UPVOTE_OPTIONS,
      downvoteOptions: DEFAULT_DOWNVOTE_OPTIONS,
    },
    insight: {
      titleKey: translationKey(
        'Label.Assistant.MonthlyReportWithDateRange',
        TranslationNamespace.AnalyticsAssistant,
      ),
    },
    preloadCanvasSections: true,
  },
  [InsightTypeV2.SummaryReport7Days]: {
    prevPage: analyticsCreationOverviewNavigationItem,
    summary: {
      titleKey: translationKey('Heading.Assistant', TranslationNamespace.AnalyticsAssistant),
      titleChipKey: translationKey('Label.Beta', TranslationNamespace.AnalyticsAssistant),
    },
    canvas: {
      titleKey: translationKey('Label.Charts', TranslationNamespace.AnalyticsAssistant),
      titleIcon: BarChartIcon,
    },
    feedback: {
      upvoteOptions: DEFAULT_UPVOTE_OPTIONS,
      downvoteOptions: DEFAULT_DOWNVOTE_OPTIONS,
    },
    insight: {
      titleKey: translationKey(
        'Label.Assistant.WeeklyReportWithDateRange',
        TranslationNamespace.AnalyticsAssistant,
      ),
    },
    preloadCanvasSections: true,
  },
  [InsightTypeV2.MetricsSummary]: {
    prevPage: analyticsRetentionNavigationItem,
    summary: {
      // TODO(lucaswang, 2025-11-04): https://roblox.atlassian.net/browse/DSA-5151
      // Move this into a helper method that takes in translation dependencies. Dashboard insights requires dynamic translation based on page key.
      titleKey: translationKey(
        'Label.DashboardInsights.RetentionInsight',
        TranslationNamespace.AnalyticsAssistant,
      ),
      titleChipKey: translationKey('Label.Beta', TranslationNamespace.AnalyticsAssistant),
    },
    canvas: {
      titleKey: translationKey('Label.Charts', TranslationNamespace.AnalyticsAssistant),
      titleIcon: BarChartIcon,
    },
    feedback: {
      upvoteOptions: DEFAULT_UPVOTE_OPTIONS,
      downvoteOptions: DEFAULT_DOWNVOTE_OPTIONS,
    },
    insight: {
      titleKey: translationKey(
        'Label.DashboardInsights.RetentionInsight',
        TranslationNamespace.AnalyticsAssistant,
      ),
    },
    preloadCanvasSections: true,
  },
  [InsightTypeV2.PlayerFeedbackReport7Days]: {
    prevPage: analyticsFeedbackNavigationItem,
    summary: {
      titleKey: translationKey(
        'Label.Assistant.FeedbackReport',
        TranslationNamespace.AnalyticsAssistant,
      ),
      titleChipKey: translationKey('Label.Beta', TranslationNamespace.AnalyticsAssistant),
    },
    canvas: {
      titleKey: translationKey('Label.UserFeedback', TranslationNamespace.Analytics),
      titleIcon: BarChartIcon,
    },
    feedback: {
      upvoteOptions: DEFAULT_UPVOTE_OPTIONS,
      downvoteOptions: PLAYER_FEEDBACK_DOWNVOTE_OPTIONS,
    },
  },
  [InsightTypeV2.PlayerFeedbackReport28Days]: {
    prevPage: analyticsFeedbackNavigationItem,
    summary: {
      titleKey: translationKey('Heading.Assistant', TranslationNamespace.AnalyticsAssistant),
      titleChipKey: translationKey('Label.Beta', TranslationNamespace.AnalyticsAssistant),
    },
    canvas: {
      titleKey: translationKey('Label.UserFeedback', TranslationNamespace.Analytics),
      titleIcon: BarChartIcon,
    },
    feedback: {
      upvoteOptions: DEFAULT_UPVOTE_OPTIONS,
      downvoteOptions: PLAYER_FEEDBACK_DOWNVOTE_OPTIONS,
    },
  },
};
export default AssistantSummaryDisplayConfigs;
