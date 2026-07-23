import { FunctionComponent, useMemo, useState } from 'react';
import {
  AnalyticsPageDescription,
  AnalyticsDocLink,
  AnalyticsPageTitle,
  analyticsSubscriptionsNavigationItem,
  DateRangeType,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import {
  AnalyticsContextLayerInnerProvider,
  AnalyticsPageConfigAnnotationOptions,
  CreatorAnalyticsPageSurfaceConfig,
  ExperienceAnalyticsTabbedPageLayout,
  useRAQIV2TranslationDependencies,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import { EmptyGrid, Item, Link } from '@modules/miscellaneous/common';
import { SingleAssociatedItemTypeContentContainer } from '@modules/creations';
import { ExperienceSubscriptionsClientProvider } from '@modules/experience-subscriptions/context/ExperienceSubscriptionsClientProvider';
import AnalyticsTabContent from '@modules/experience-subscriptions/pages/ExperienceSubscriptionsPage/AnalyticsTabContent';
import HistoryTabContent from '@modules/experience-subscriptions/pages/ExperienceSubscriptionsPage/HistoryTabContent';
import SubscriptionsTableContainer from '@modules/experience-subscriptions/containers/SubscriptionsTableContainer';
import { Button, CircularProgress, Grid } from '@rbx/ui';
import { FeedbackBanner } from '@rbx/foundation-ui';
import { useUniversePermissions } from '@modules/react-query/organizations';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagName, useSettings } from '@modules/settings';
import useSettingsWhitelist from '@modules/miscellaneous/hooks/useSettingsWhitelist';
import NextLink from 'next/link';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';

const subscriptionsDocLink: AnalyticsDocLink =
  '/docs/production/monetization/subscriptions#subscription-analytics';

enum SubscriptionsPageTabKey {
  Creations = 'Creations',
  Analytics = 'Analytics',
  History = 'History',
}

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
const makeTakeActionLink = (chunks: React.ReactNode) => {
  return (
    <Link href={subscriptionsDocLink} target='_blank' underline='none'>
      {chunks}
    </Link>
  );
};

const SubscriptionsPageContent: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate, translateHTML } = useRAQIV2TranslationDependencies();
  const { userCanViewAnalyticsForUniverse, isFetched } = useFeatureFlagsForNamespace(
    'userCanViewAnalyticsForUniverse',
    FeatureFlagNamespace.Analytics,
  );
  const { id: universeId, isLoading: isLoadingUniverse } = useUniverseResource();
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);
  const { settings, isFetched: isSettingsFetched } = useSettings();
  const devSubsInRobuxAllowlist = useSettingsWhitelist(FeatureFlagName.devSubsInRobuxAllowlist);
  const shouldAllowDevSubsInRobux =
    isSettingsFetched &&
    (!!settings?.enableDeveloperSubscriptionsInRobux || devSubsInRobuxAllowlist);

  const creationsTab = useMemo(() => {
    let content;
    if (!universeId) {
      content = (
        <EmptyGrid>
          <CircularProgress color='secondary' />
        </EmptyGrid>
      );
    } else if (shouldAllowDevSubsInRobux) {
      content = (
        <ExperienceSubscriptionsClientProvider>
          <SubscriptionsTableContainer universeId={universeId} />
        </ExperienceSubscriptionsClientProvider>
      );
    } else {
      content = <SingleAssociatedItemTypeContentContainer itemType={Item.ExperienceSubscription} />;
    }

    return {
      key: SubscriptionsPageTabKey.Creations,
      label: translate(translationKey('Heading.Creations', TranslationNamespace.Navigation)),
      content,
    };
  }, [translate, universeId, shouldAllowDevSubsInRobux]);

  const analyticsTab = useMemo(
    () => ({
      key: SubscriptionsPageTabKey.Analytics,
      label: translate(translationKey('Heading.Analytics', TranslationNamespace.Analytics)),
      content: (
        <AnalyticsContextLayerInnerProvider config={config}>
          <AnalyticsTabContent showDataMayBeBehindLabel />
        </AnalyticsContextLayerInnerProvider>
      ),
    }),
    [translate],
  );

  const historyTab = useMemo(
    () => ({
      key: SubscriptionsPageTabKey.History,
      label: translate(translationKey('Tab.History', TranslationNamespace.ExperienceSubscriptions)),
      content: <HistoryTabContent />,
    }),
    [translate],
  );

  const createSubscriptionLink = universeId
    ? `/dashboard/creations/experiences/${universeId}/experience-subscriptions/create`
    : '#';

  const title = useMemo(
    () => (
      <AnalyticsPageTitle
        text={translate(translationKey('Heading.Subscriptions', TranslationNamespace.Navigation))}
      />
    ),
    [translate],
  );

  const description = useMemo(
    () => (
      <Grid item container justifyContent='space-between' alignItems='center'>
        <Grid item>
          <AnalyticsPageDescription
            text={translateHTML(
              translationKey('Description.TakeActionSubscriptions', TranslationNamespace.Analytics),
              [
                {
                  opening: 'linkStart',
                  closing: 'linkEnd',
                  content: makeTakeActionLink,
                },
              ],
            )}
          />
        </Grid>
        {universeId && permissions?.monetizeExperience && (
          <Grid item style={{ marginBottom: 24 }}>
            <Button
              component={NextLink}
              href={createSubscriptionLink}
              variant='contained'
              color='primaryBrand'
              size='medium'>
              {translate(
                translationKey(
                  'Action.CreateSubscription',
                  TranslationNamespace.ExperienceSubscriptions,
                ),
              )}
            </Button>
          </Grid>
        )}
      </Grid>
    ),
    [translateHTML, translate, universeId, permissions?.monetizeExperience, createSubscriptionLink],
  );

  const orderedTabs = useMemo(() => {
    const tabs = [];
    if (permissions?.monetizeExperience) {
      tabs.push(creationsTab);
    }
    if (userCanViewAnalyticsForUniverse) {
      tabs.push(analyticsTab);
      tabs.push(historyTab);
    }
    return tabs;
  }, [permissions, userCanViewAnalyticsForUniverse, creationsTab, analyticsTab, historyTab]);

  const ROBUX_BANNER_DISMISSED_KEY = 'robuxSubscriptionsBannerDismissed';
  const [isRobuxBannerDismissed, setIsRobuxBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem(ROBUX_BANNER_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissRobuxBanner = () => {
    setIsRobuxBannerDismissed(true);
    try {
      localStorage.setItem(ROBUX_BANNER_DISMISSED_KEY, 'true');
    } catch {
      // localStorage unavailable
    }
  };

  const robuxBannerElement =
    shouldAllowDevSubsInRobux && !isRobuxBannerDismissed ? (
      <FeedbackBanner
        title={translate(
          translationKey(
            'Heading.RobuxSubscriptionsBanner',
            TranslationNamespace.ExperienceSubscriptions,
          ),
        )}
        description={translate(
          translationKey(
            'Description.RobuxSubscriptionsBanner',
            TranslationNamespace.ExperienceSubscriptions,
          ),
        )}
        layout='Stacked'
        variant='Emphasis'
        severity='Info'
        primaryActionLabel={translate(
          translationKey('Action.GetStarted', TranslationNamespace.ExperienceSubscriptions),
        )}
        onPrimaryAction={() => {
          window.location.href = createSubscriptionLink;
        }}
        onDismiss={handleDismissRobuxBanner}
      />
    ) : undefined;

  if (!isFetched || isLoadingPermissions || isLoadingUniverse) {
    return (
      <EmptyGrid>
        <CircularProgress color='secondary' />
      </EmptyGrid>
    );
  }

  return (
    // eslint-disable-next-line deprecation/deprecation -- DSA-3204 to migrate
    <ExperienceAnalyticsTabbedPageLayout
      title={title}
      description={description}
      heroElement={robuxBannerElement}
      addHeroDivider={false}
      controls={[]}
      tabs={orderedTabs}
      navigationItem={analyticsSubscriptionsNavigationItem}
    />
  );
};

export default withTranslation(SubscriptionsPageContent, [
  TranslationNamespace.Navigation,
  TranslationNamespace.Analytics,
  TranslationNamespace.ExperienceSubscriptions,
]);
