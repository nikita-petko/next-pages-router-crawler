import {
  analyticsAudienceNavigationItem,
  AnalyticsDocLink,
  SingleDateType,
} from '@modules/charts-generic';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { translationKey } from '@modules/analytics-translations';
import { RAQIV2MetricGranularity, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import {
  AnalyticsPageConfigAnnotationOptions,
  CreatorAnalyticsUntabbedPageConfig,
  RAQIV2SpecialLayoutType,
  CreatorAnalyticsPageMode,
  CreatorAnalyticsLayout,
  EndDateBehavior,
  AnalyticsPageConfigDateOptions,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import React, { FC } from 'react';
import { withTranslation } from '@rbx/intl';
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
  filterDimensions: engagementDimensions.filter((d) => d !== RAQIV2Dimension.IsNewUser),
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
