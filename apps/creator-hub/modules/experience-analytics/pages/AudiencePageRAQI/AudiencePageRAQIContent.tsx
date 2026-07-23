import type { FC } from 'react';
import { RAQIV2MetricGranularity, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { withTranslation } from '@rbx/intl';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsAudienceNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import SingleDateType from '@modules/charts-generic/enums/SingleDateType';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsUntabbedPageConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import {
  CreatorAnalyticsPageMode,
  EndDateBehavior,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import engagementDimensions from '../EngagementPageV2/engagementDimensions';
import {
  chartConfigAudienceAge,
  chartConfigAudienceCountry,
  chartConfigAudienceGender,
  chartConfigAudienceLanguage,
  summaryCardConfigMAUSummary,
} from './audienceChartConfigs';
import AudienceContentRestrictionBanner from './AudienceContentRestrictionBanner';

const audienceDocLink: AnalyticsDocLink = '/docs/production/analytics/audience';

const audiencePageConfig: CreatorAnalyticsUntabbedPageConfig = {
  mode: CreatorAnalyticsPageMode.Untabbed,
  debugPageName: 'Audience',
  docLinks: [audienceDocLink],
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  title: analyticsAudienceNavigationItem.title,
  description: {
    standard: translationKey('Description.TakeActionAudience', TranslationNamespace.Analytics),
  },
  timeRangeOptions: {
    type: 'singleDay',
    supportedDates: [
      SingleDateType.MostRecent,
      SingleDateType.ThirtyDaysAgo,
      SingleDateType.SixtyDaysAgo,
      SingleDateType.NinetyDaysAgo,
      SingleDateType.ThreeSixtyFiveDaysAgo,
      SingleDateType.Custom,
    ],
    defaultDate: SingleDateType.MostRecent,
    maxEndDateOffset: 2,
  } as const satisfies AnalyticsPageConfigDateOptions,
  surfaceAnnotationOptions: {
    supportedAnnotationTypes: [AnnotationType.Announcement],
    defaultAnnotationTypes: [],
    showAnnotationsControl: false,
  } as const satisfies AnalyticsPageConfigAnnotationOptions,
  granularity: { fixed: RAQIV2MetricGranularity.OneDay },
  filterDimensions: engagementDimensions.filter(
    (dimension) =>
      dimension !== RAQIV2Dimension.IsNewUser && dimension !== RAQIV2Dimension.UserO18Eligibility,
  ),
  breakdownDimensions: [],
  additionalBanners: <AudienceContentRestrictionBanner />,
  body: [
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [summaryCardConfigMAUSummary, chartConfigAudienceCountry],
    },
    {
      type: RAQIV2SpecialLayoutType.VerticalPriorityLayout,
      firstColumn: [chartConfigAudienceGender, chartConfigAudienceAge],
      secondColumn: [chartConfigAudienceLanguage],
    },
  ],
  endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
};

const AudiencePageRAQIContent: FC = () => {
  return <CreatorAnalyticsLayout config={audiencePageConfig} />;
};

export default withTranslation(AudiencePageRAQIContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.Navigation,
]);
