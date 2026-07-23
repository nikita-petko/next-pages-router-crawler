import React, { useMemo } from 'react';
import {
  AnalyticsComponentType,
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsLayout,
  CreatorAnalyticsPageMode,
  CreatorAnalyticsUntabbedPageConfig,
  RAQIV2SpecialLayoutType,
  RAQIV2UIComponent,
} from '@modules/experience-analytics-shared';
import { DateRangeType } from '@modules/charts-generic';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AffiliateProgramBanner from '@modules/affiliate-program/components/AffiliateProgramBanner';
import AffiliateProgramProvider from '@modules/affiliate-program/providers/AffiliateProgramProvider';
import { Alert, AlertTitle, Grid } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { PageLoading } from '@modules/miscellaneous/common';
import {
  componentConfigCreatorRewardsEarnedRobux,
  chartConfigCreatorRewardsQualifiedReactivationRatio,
  chartConfigCreatorRewardsQualifiedReactivations,
  chartConfigCreatorRewardsQualifiedSignupRatio,
  chartConfigCreatorRewardsQualifiedSignups,
  chartConfigCreatorRewardsQualifiedSpenderPlays,
  chartConfigCreatorRewardsQualifiedSpenderRatio,
} from './chartConfigs';
import componentConfigTabbedAudienceExpansionFunnelTable from './TabbedAudienceExpansionFunnelTable';

const creatorRewardsTimeRangeOptions = {
  type: 'dateRange',
  supportedRanges: [
    DateRangeType.Last7Days,
    DateRangeType.Last28Days,
    DateRangeType.Last56Days,
    DateRangeType.Last90Days,
    DateRangeType.Last365Days,
    DateRangeType.Custom,
  ],
  defaultRange: DateRangeType.Last90Days,
} as const satisfies AnalyticsPageConfigDateOptions;

const creatorRewardsSurfaceAnnotationOptions = {
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
  showAnnotationsControl: true,
} as const satisfies AnalyticsPageConfigAnnotationOptions;
const CreatorRewardsPage = () => {
  const { showCreatorRewardsReportingDisclaimer, isFetched } = useFeatureFlagsForNamespace(
    ['showCreatorRewardsReportingDisclaimer'] as const,
    FeatureFlagNamespace.Analytics,
  );
  const { translate } = useTranslation();

  const creatorRewardsPageConfig: CreatorAnalyticsUntabbedPageConfig = useMemo(() => {
    const pageBody: RAQIV2UIComponent[] = [
      {
        type: RAQIV2SpecialLayoutType.FullWidthLayout,
        items: [componentConfigCreatorRewardsEarnedRobux],
      },
      {
        type: RAQIV2SpecialLayoutType.SectionTitle,
        titleKey: translationKey('Title.DailyEngagementRewards', TranslationNamespace.Analytics),
      },
      chartConfigCreatorRewardsQualifiedSpenderPlays,
      chartConfigCreatorRewardsQualifiedSpenderRatio,
      {
        type: RAQIV2SpecialLayoutType.SectionTitle,
        titleKey: translationKey('Title.AudienceExpansionRewards', TranslationNamespace.Analytics),
      },
      chartConfigCreatorRewardsQualifiedSignups,
      chartConfigCreatorRewardsQualifiedSignupRatio,
      chartConfigCreatorRewardsQualifiedReactivations,
      chartConfigCreatorRewardsQualifiedReactivationRatio,
      {
        type: RAQIV2SpecialLayoutType.FullWidthLayout,
        items: [componentConfigTabbedAudienceExpansionFunnelTable],
      },
    ];

    const pageConfig: CreatorAnalyticsUntabbedPageConfig = {
      mode: CreatorAnalyticsPageMode.Untabbed,
      debugPageName: 'ExperienceCreatorRewards',
      title: translationKey('Heading.CreatorRewards', TranslationNamespace.Analytics),
      description: {
        standard: translationKey(
          'Description.TakeActionCreatorRewards',
          TranslationNamespace.Analytics,
        ),
      },
      docLinks: ['/docs/creator-rewards', '/dashboard/analytics?tab=ShareLinks'],
      resourceTypes: [RAQIV2ChartResourceType.Universe],
      timeRangeOptions: creatorRewardsTimeRangeOptions,
      surfaceAnnotationOptions: creatorRewardsSurfaceAnnotationOptions,
      granularity: {
        options: [
          RAQIV2MetricGranularity.OneDay,
          RAQIV2MetricGranularity.OneWeek,
          RAQIV2MetricGranularity.OneMonth,
        ],
      },
      breakdownDimensions: [],
      filterDimensions: [],
      preControlCharts: [
        {
          type: RAQIV2SpecialLayoutType.FullWidthLayout,
          items: [
            {
              type: AnalyticsComponentType.NonGeneric,
              metrics: [],
              renderer: {
                type: 'isolated',
                render: () => {
                  return (
                    <Grid gap={1} display='flex' direction='column'>
                      {showCreatorRewardsReportingDisclaimer && (
                        <Alert severity='info'>
                          <AlertTitle>
                            {translate('Description.MissingCreatorRewardsDataBanner')}
                          </AlertTitle>
                          {translate('Description.GeneralBreakglassBanner')}
                        </Alert>
                      )}
                      <AffiliateProgramProvider>
                        <AffiliateProgramBanner />
                      </AffiliateProgramProvider>
                    </Grid>
                  );
                },
              },
            },
          ],
        },
      ],
      body: pageBody,
    };

    return pageConfig;
  }, [showCreatorRewardsReportingDisclaimer, translate]);

  if (!isFetched) {
    return <PageLoading />;
  }

  return <CreatorAnalyticsLayout config={creatorRewardsPageConfig} />;
};

export default CreatorRewardsPage;
