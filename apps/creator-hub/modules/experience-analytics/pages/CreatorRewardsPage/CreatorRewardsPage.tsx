import { useMemo } from 'react';
import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Grid } from '@rbx/ui';
import { showCreatorRewardsReportingDisclaimer as showCreatorRewardsReportingDisclaimerFlag } from '@generated/flags/creatorAnalytics';
import AffiliateProgramBanner from '@modules/affiliate-program/components/AffiliateProgramBanner';
import AffiliateProgramProvider from '@modules/affiliate-program/providers/AffiliateProgramProvider';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import { CreatorAnalyticsPageMode } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsUntabbedPageConfig,
  RAQIV2UIComponent,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
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
    RAQIV2DateRangeType.Last7Days,
    RAQIV2DateRangeType.Last28Days,
    RAQIV2DateRangeType.Last56Days,
    RAQIV2DateRangeType.Last90Days,
    RAQIV2DateRangeType.Last365Days,
    RAQIV2DateRangeType.Custom,
  ],
  defaultRange: RAQIV2DateRangeType.Last90Days,
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
  const { ready: isFetched, value: showCreatorRewardsReportingDisclaimerValue } = useFlag(
    showCreatorRewardsReportingDisclaimerFlag,
  );
  const showCreatorRewardsReportingDisclaimer =
    isFetched && showCreatorRewardsReportingDisclaimerValue;
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
