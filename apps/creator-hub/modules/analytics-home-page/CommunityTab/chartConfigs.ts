import {
  RAQIV2Dimension,
  RAQIV2ForumContentEventType,
  RAQIV2MembershipEventType,
  RAQIV2Metric,
  RAQIV2PageViewContext,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import {
  RAQIV2SummaryType,
  type RAQIV2CompoundSummaryType,
} from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import type { TabbedChartConfig } from '@modules/experience-analytics-shared/types/RAQIV2TabbedChartConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const totalAndAverageSummary = [
  { type: RAQIV2SummaryType.Total },
  { type: RAQIV2SummaryType.Average },
] as const;

const totalOnlySummary = [{ type: RAQIV2SummaryType.Total }] as const;

const makeCommunityGroupPageViewsChart = (
  contexts: readonly RAQIV2PageViewContext[],
  summaryTypes: readonly RAQIV2CompoundSummaryType[] = totalAndAverageSummary,
) =>
  ({
    type: AnalyticsComponentType.Chart,
    titleKey: translationKey(
      'Label.Metric.CommunityGroupPageViews',
      TranslationNamespace.Community,
    ),
    definitionTooltipKey: translationKey(
      'Description.CommunityGroupPageViews',
      TranslationNamespace.Community,
    ),
    metric: RAQIV2Metric.CommunityGroupPageViews,
    overrides: {
      filter: {
        intersect: [{ dimension: RAQIV2Dimension.PageViewContext, values: [...contexts] }],
      },
    },
    chartType: ChartType.Spline,
    summarySpec: {
      totalSummaryTypes: [...summaryTypes],
      perBreakdownSummaryTypes: [],
      aggregatedBreakdownSummaryTypes: [],
    },
  }) satisfies ChartConfig;

const makeCommunityGroupPageUniqueVisitorsChart = (
  contexts: readonly RAQIV2PageViewContext[],
  summaryTypes: readonly RAQIV2CompoundSummaryType[] = totalAndAverageSummary,
) =>
  ({
    type: AnalyticsComponentType.Chart,
    titleKey: translationKey(
      'Label.Metric.CommunityGroupPageUniqueVisitors',
      TranslationNamespace.Community,
    ),
    definitionTooltipKey: translationKey(
      'Description.CommunityGroupPageUniqueVisitors',
      TranslationNamespace.Community,
    ),
    metric: RAQIV2Metric.CommunityGroupPageUniqueVisitors,
    overrides: {
      filter: {
        intersect: [{ dimension: RAQIV2Dimension.PageViewContext, values: [...contexts] }],
      },
    },
    chartType: ChartType.Spline,
    summarySpec: {
      totalSummaryTypes: [...summaryTypes],
      perBreakdownSummaryTypes: [],
      aggregatedBreakdownSummaryTypes: [],
    },
  }) satisfies ChartConfig;

// -- Visitor traffic section --

export const chartConfigCommunityGroupPageViews = makeCommunityGroupPageViewsChart([
  RAQIV2PageViewContext.PageViewApp,
  RAQIV2PageViewContext.PageViewWeb,
]);

export const chartConfigCommunityGroupPageUniqueVisitors =
  makeCommunityGroupPageUniqueVisitorsChart([
    RAQIV2PageViewContext.PageViewApp,
    RAQIV2PageViewContext.PageViewWeb,
  ]);

export const tabbedChartConfigCommunityVisits = {
  type: AnalyticsComponentType.TabbedChart,
  titleKey: translationKey('Label.Metric.CommunityGroupPageViews', TranslationNamespace.Community),
  definitionTooltipKey: translationKey(
    'Description.CommunityGroupPageViews',
    TranslationNamespace.Community,
  ),
  tabs: [
    {
      chart: chartConfigCommunityGroupPageViews,
      tabLabel: translationKey('Label.Total', TranslationNamespace.Community),
    },
    {
      chart: chartConfigCommunityGroupPageUniqueVisitors,
      tabLabel: translationKey('Label.Unique', TranslationNamespace.Community),
    },
  ],
} as const satisfies TabbedChartConfig;

// -- Membership section --

export const chartConfigCommunityMembershipCount = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Label.Metric.MembershipTrends', TranslationNamespace.Community),
  definitionTooltipKey: translationKey(
    'Description.MembershipTrends',
    TranslationNamespace.Community,
  ),
  metric: RAQIV2Metric.CommunityMembershipCount,
  overrides: {},
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.LastValue }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigCommunityMembershipChangeEvents = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Label.Metric.CommunityMembershipChangeEvents',
    TranslationNamespace.Community,
  ),
  definitionTooltipKey: translationKey(
    'Description.CommunityMembershipChangeEvents',
    TranslationNamespace.Community,
  ),
  metric: RAQIV2Metric.CommunityMembershipChangeEvents,
  overrides: {},
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }, { type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

const chartConfigCommunityMembershipJoins = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Label.Metric.CommunityMembershipChangeEvents',
    TranslationNamespace.Community,
  ),
  definitionTooltipKey: translationKey(
    'Description.CommunityMembershipChangeEvents',
    TranslationNamespace.Community,
  ),
  metric: RAQIV2Metric.CommunityMembershipChangeEvents,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.MembershipEventType,
          values: [RAQIV2MembershipEventType.Join],
        },
      ],
    },
  },
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

const chartConfigCommunityMembershipChurn = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Label.Metric.CommunityMembershipChangeEvents',
    TranslationNamespace.Community,
  ),
  definitionTooltipKey: translationKey(
    'Description.CommunityMembershipChangeEvents',
    TranslationNamespace.Community,
  ),
  metric: RAQIV2Metric.CommunityMembershipChangeEvents,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.MembershipEventType,
          values: [RAQIV2MembershipEventType.Churn],
        },
      ],
    },
  },
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const tabbedChartConfigMembershipTrends = {
  type: AnalyticsComponentType.TabbedChart,
  titleKey: translationKey('Label.Metric.MembershipTrends', TranslationNamespace.Community),
  definitionTooltipKey: translationKey(
    'Description.MembershipTrends',
    TranslationNamespace.Community,
  ),
  tabs: [
    {
      chart: chartConfigCommunityMembershipCount,
      tabLabel: translationKey('Label.TotalMembers', TranslationNamespace.Community),
    },
    {
      chart: chartConfigCommunityMembershipJoins,
      tabLabel: translationKey('Label.Joins', TranslationNamespace.Community),
    },
    {
      chart: chartConfigCommunityMembershipChurn,
      tabLabel: translationKey('Label.Churn', TranslationNamespace.Community),
    },
  ],
} as const satisfies TabbedChartConfig;

// -- Forum visits (same cube as community visits, filtered by ForumView) --

const forumVisitsTotal = makeCommunityGroupPageViewsChart([RAQIV2PageViewContext.ForumView]);

const forumVisitsUnique = makeCommunityGroupPageUniqueVisitorsChart([
  RAQIV2PageViewContext.ForumView,
]);

export const tabbedChartConfigForumVisits = {
  type: AnalyticsComponentType.TabbedChart,
  titleKey: translationKey('Label.Metric.ForumVisits', TranslationNamespace.Community),
  definitionTooltipKey: translationKey('Description.ForumVisits', TranslationNamespace.Community),
  tabs: [
    {
      chart: forumVisitsTotal,
      tabLabel: translationKey('Label.Total', TranslationNamespace.Community),
    },
    {
      chart: forumVisitsUnique,
      tabLabel: translationKey('Label.Unique', TranslationNamespace.Community),
    },
  ],
} as const satisfies TabbedChartConfig;

// -- Forum detail charts (filtered by ForumContentEventType) --

const forumEventCountChart = (eventType: RAQIV2ForumContentEventType) =>
  ({
    type: AnalyticsComponentType.Chart,
    titleKey: translationKey(
      'Label.Metric.CommunityForumContentEventCount',
      TranslationNamespace.Community,
    ),
    definitionTooltipKey: translationKey(
      'Description.CommunityForumContentEventCount',
      TranslationNamespace.Community,
    ),
    metric: RAQIV2Metric.CommunityForumContentEventCount,
    overrides: {
      filter: {
        intersect: [{ dimension: RAQIV2Dimension.ForumContentEventType, values: [eventType] }],
      },
    },
    chartType: ChartType.Spline,
    summarySpec: {
      totalSummaryTypes: [...totalOnlySummary],
      perBreakdownSummaryTypes: [],
      aggregatedBreakdownSummaryTypes: [],
    },
  }) satisfies ChartConfig;

const forumUniqueUsersChart = (eventType: RAQIV2ForumContentEventType) =>
  ({
    type: AnalyticsComponentType.Chart,
    titleKey: translationKey(
      'Label.Metric.CommunityForumContentUniqueUsers',
      TranslationNamespace.Community,
    ),
    definitionTooltipKey: translationKey(
      'Description.CommunityForumContentUniqueUsers',
      TranslationNamespace.Community,
    ),
    metric: RAQIV2Metric.CommunityForumContentUniqueUsers,
    overrides: {
      filter: {
        intersect: [{ dimension: RAQIV2Dimension.ForumContentEventType, values: [eventType] }],
      },
    },
    chartType: ChartType.Spline,
    summarySpec: {
      totalSummaryTypes: [...totalOnlySummary],
      perBreakdownSummaryTypes: [],
      aggregatedBreakdownSummaryTypes: [],
    },
  }) satisfies ChartConfig;

export const tabbedChartConfigPostsCreated = {
  type: AnalyticsComponentType.TabbedChart,
  titleKey: translationKey('Label.Metric.PostsCreated', TranslationNamespace.Community),
  definitionTooltipKey: translationKey('Description.PostsCreated', TranslationNamespace.Community),
  tabs: [
    {
      chart: forumEventCountChart(RAQIV2ForumContentEventType.PostCreate),
      tabLabel: translationKey('Label.Total', TranslationNamespace.Community),
    },
    {
      chart: forumUniqueUsersChart(RAQIV2ForumContentEventType.PostCreate),
      tabLabel: translationKey('Label.Unique', TranslationNamespace.Community),
    },
  ],
} as const satisfies TabbedChartConfig;

// -- Post views (same cube as community visits, filtered by PostView) --

const postViewsTotal = makeCommunityGroupPageViewsChart(
  [RAQIV2PageViewContext.PostView],
  totalOnlySummary,
);

const postViewsUnique = makeCommunityGroupPageUniqueVisitorsChart(
  [RAQIV2PageViewContext.PostView],
  totalOnlySummary,
);

export const tabbedChartConfigPostViews = {
  type: AnalyticsComponentType.TabbedChart,
  titleKey: translationKey('Label.Metric.PostViews', TranslationNamespace.Community),
  definitionTooltipKey: translationKey('Description.PostViews', TranslationNamespace.Community),
  tabs: [
    {
      chart: postViewsTotal,
      tabLabel: translationKey('Label.Total', TranslationNamespace.Community),
    },
    {
      chart: postViewsUnique,
      tabLabel: translationKey('Label.Unique', TranslationNamespace.Community),
    },
  ],
} as const satisfies TabbedChartConfig;

export const tabbedChartConfigPostComments = {
  type: AnalyticsComponentType.TabbedChart,
  titleKey: translationKey('Label.Metric.PostComments', TranslationNamespace.Community),
  definitionTooltipKey: translationKey('Description.PostComments', TranslationNamespace.Community),
  tabs: [
    {
      chart: forumEventCountChart(RAQIV2ForumContentEventType.CommentCreate),
      tabLabel: translationKey('Label.Total', TranslationNamespace.Community),
    },
    {
      chart: forumUniqueUsersChart(RAQIV2ForumContentEventType.CommentCreate),
      tabLabel: translationKey('Label.Unique', TranslationNamespace.Community),
    },
  ],
} as const satisfies TabbedChartConfig;

export const tabbedChartConfigPostReactions = {
  type: AnalyticsComponentType.TabbedChart,
  titleKey: translationKey('Label.Metric.PostReactions', TranslationNamespace.Community),
  definitionTooltipKey: translationKey('Description.PostReactions', TranslationNamespace.Community),
  tabs: [
    {
      chart: forumEventCountChart(RAQIV2ForumContentEventType.ReactionToggleOn),
      tabLabel: translationKey('Label.Total', TranslationNamespace.Community),
    },
    {
      chart: forumUniqueUsersChart(RAQIV2ForumContentEventType.ReactionToggleOn),
      tabLabel: translationKey('Label.Unique', TranslationNamespace.Community),
    },
  ],
} as const satisfies TabbedChartConfig;
