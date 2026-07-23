import { useEffect, useState } from 'react';

import { useTranslation, withTranslation } from '@rbx/intl';
import {
  AnalyticsPageTitle,
  AnalyticsPageDescription,
  AnalyticsDocLink,
  DateRangeType,
  analyticsExperienceSubscriptionsNavigationItem,
} from '@modules/charts-generic';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import {
  AnalyticsContextLayerInnerProvider,
  AnalyticsPageConfigAnnotationOptions,
  CreatorAnalyticsPageSurfaceConfig,
  ExperienceAnalyticsTabbedPageLayout,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import { Link } from '@rbx/ui';
import { IXPLayers, fetchIXPParametersForCurrentUser } from '@modules/clients/ixpExperiments';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
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
      DateRangeType.Last7Days,
      DateRangeType.Last28Days,
      DateRangeType.Last56Days,
      DateRangeType.Last90Days,
      DateRangeType.Last365Days,
      DateRangeType.Custom,
    ],
    defaultRange: DateRangeType.Last28Days,
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
  const { userCanViewAnalyticsForUniverse } = useFeatureFlagsForNamespace(
    'userCanViewAnalyticsForUniverse',
    FeatureFlagNamespace.Analytics,
  );
  const [isIXPSubscriptionAnalyticsTestEnabled, setIsIXPSubscriptionAnalyticsTestEnabled] =
    useState(false);

  const { translate, translateHTML } = useTranslationWrapper(useTranslation());

  // TODO: remove after launch
  // https://roblox.atlassian.net/browse/SUBS-2165
  useEffect(() => {
    fetchIXPParametersForCurrentUser(IXPLayers.CreatorDashboard).then((result) => {
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

  return userCanViewAnalyticsForUniverse || isIXPSubscriptionAnalyticsTestEnabled ? (
    // eslint-disable-next-line deprecation/deprecation -- TODO: migrate to use page layout config
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
