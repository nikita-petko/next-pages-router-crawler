import { useEffect, useState } from 'react';
import { StatusCodes } from '@rbx/core';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Link } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsExperienceSubscriptionsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { AnalyticsPageDescription } from '@modules/charts-generic/layout/AnalyticsPageDescription';
import { AnalyticsPageTitle } from '@modules/charts-generic/layout/AnalyticsPageTitle';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { IXPLayers, fetchIXPParametersForCurrentUser } from '@modules/clients/ixpExperiments';
import { AnalyticsContextLayerInnerProvider } from '@modules/experience-analytics-shared/context/AnalyticsContextLayerProvider';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { ExperienceAnalyticsTabbedPageLayout } from '@modules/experience-analytics-shared/layout/NonConfigurationBasedExperienceAnalyticsTabbedPageLayout';
import type {
  AnalyticsPageConfigAnnotationOptions,
  CreatorAnalyticsPageSurfaceConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ExperienceSubscriptionsPageTabKey from '../../enums/ExperienceSubscriptionsPageTabKey';
import AnalyticsTabContent from './AnalyticsTabContent';
import HistoryTabContent from './HistoryTabContent';

// TODO(gperkins@20260210): Remove empty configs per DSA-5306
const config: CreatorAnalyticsPageSurfaceConfig = {
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  filterDimensions: [],
  breakdownDimensions: [],
  timeRangeOptions: {
    type: 'dateRange',
    supportedRanges: [
      RAQIV2DateRangeType.Last7Days,
      RAQIV2DateRangeType.Last28Days,
      RAQIV2DateRangeType.Last56Days,
      RAQIV2DateRangeType.Last90Days,
      RAQIV2DateRangeType.Last365Days,
      RAQIV2DateRangeType.Custom,
    ],
    defaultRange: RAQIV2DateRangeType.Last28Days,
    excludeEndDateInRange: false,
    maxEndDateOffset: 0,
    maxStartDateOffsetDays: 365,
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
    showAnnotationsControl: true,
  } as const satisfies AnalyticsPageConfigAnnotationOptions,
  body: [],
};

const subscriptionsDocLink: AnalyticsDocLink =
  '/docs/production/monetization/subscriptions#subscription-analytics';

function ExperienceSubscriptionsPage() {
  const { id: universeId } = useUniverseResource();
  const { userCanViewAnalyticsForUniverse, isPending: isPendingAnalyticsExperiencePermissions } =
    useAnalyticsExperiencePermissions(universeId);
  const [isIXPSubscriptionAnalyticsTestEnabled, setIsIXPSubscriptionAnalyticsTestEnabled] =
    useState(false);

  const { translate, translateHTML } = useTranslationWrapper(useTranslation());

  // TODO: remove after launch
  // https://roblox.atlassian.net/browse/SUBS-2165
  useEffect(() => {
    void fetchIXPParametersForCurrentUser(IXPLayers.CreatorDashboard).then((result) => {
      setIsIXPSubscriptionAnalyticsTestEnabled(result.enableSubscriptionActivationTest ?? false);
    });
  }, []);

  const makeTakeActionLink = (chunks: React.ReactNode) => {
    return (
      <Link href={subscriptionsDocLink} target='_blank' underline='none'>
        {chunks}
      </Link>
    );
  };

  if (isPendingAnalyticsExperiencePermissions) {
    return <PageLoading />;
  }

  return userCanViewAnalyticsForUniverse || isIXPSubscriptionAnalyticsTestEnabled ? (
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
    <ExperienceAnalyticsTabbedPageLayout
      title={
        <AnalyticsPageTitle
          text={translate(
            translationKey('Heading.Subscriptions', TranslationNamespace.ExperienceSubscriptions),
          )}
        />
      }
      description={
        <AnalyticsPageDescription
          text={translateHTML(
            translationKey(
              'TestDescription.ExperienceSubscriptionAnalytics',
              TranslationNamespace.ExperienceSubscriptions,
            ),
            [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content: makeTakeActionLink,
              },
            ],
          )}
        />
      }
      tabs={[
        {
          key: ExperienceSubscriptionsPageTabKey.Analytics,
          label: translate(
            translationKey('Tab.Trends', TranslationNamespace.ExperienceSubscriptions),
          ),
          content: (
            <AnalyticsContextLayerInnerProvider config={config}>
              <AnalyticsTabContent />
            </AnalyticsContextLayerInnerProvider>
          ),
        },
        {
          key: ExperienceSubscriptionsPageTabKey.History,
          label: translate(
            translationKey('Tab.History', TranslationNamespace.ExperienceSubscriptions),
          ),
          content: <HistoryTabContent />,
        },
      ]}
      controls={[]}
      navigationItem={analyticsExperienceSubscriptionsNavigationItem}
    />
  ) : (
    <ErrorPage errorCode={StatusCodes.FORBIDDEN} />
  );
}

export default withTranslation(ExperienceSubscriptionsPage, [
  TranslationNamespace.ExperienceSubscriptions,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.Analytics,
]);
