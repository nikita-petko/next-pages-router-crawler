import type { FC } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2Metric,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { TranslationKeyToFormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { analyticsAlertsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { AnalyticsPageAction } from '@modules/charts-generic/layout/AnalyticsPageAction';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import useIsPageContentEligible from '@modules/experience-analytics-shared/hooks/useIsPageContentEligible';
import RAQIV2EligibilityChecker from '@modules/experience-analytics-shared/types/RAQIV2EligibilityChecker';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsFixedTabPageConfig,
  RAQIV2PageEligibilityConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import {
  CreatorAnalyticsPageMode,
  EndDateBehavior,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { MAX_ALERTS_PER_RESOURCE } from '../constants/alertFormConstants';
import { AnalyticsAlertErrorCode } from '../constants/types';
import { getAlertFormValidationErrorMsg } from '../constants/validationErrorMessages';
import useAnalyticsAlertsListQuery from '../hooks/useAnalyticsAlertsListQuery';
import ActiveAlertsTable from './ActiveAlertsTable';
import AlertConfigurationsTable from './AlertConfigurationsTable';
import AlertHistoryTable from './AlertHistoryTable';

enum AlertConfigurationPageTab {
  Alerts = 'AlertConfiguration-Alert',
  Analytics = 'AlertConfiguration-Analytics',
}

const alertDocLink: AnalyticsDocLink = '/docs/production/analytics/alerts';

/**
 * Eligibility gate shared by the {@link AlertConfigurationPageTab.Alerts} tab
 * and the page-level "Create alert" action so both honour the same
 * `ManageAlerts` permission check.
 */
const alertsTabEligibility: RAQIV2PageEligibilityConfig = {
  checkerType: RAQIV2EligibilityChecker.ManageAlerts,
  ineligibleMessage: translationKey(
    'Message.PermissionDenied',
    TranslationNamespace.ExperienceAlerts,
  ),
  ignorePreControlComponents: true,
};

/**
 * "Create alert" action rendered in the page header. Disables itself and
 * surfaces an explanatory tooltip once the universe has reached
 * {@link MAX_ALERTS_PER_RESOURCE} configured alerts, mirroring the
 * `MAX_ALERT_REACHED` 409 the API would otherwise return on submit. The cap
 * is gated only when the list query has resolved successfully — while the
 * query is loading or errored we leave the button enabled so the user can
 * still attempt to create (the server will reject with `MaxAlertReached` and
 * the form will surface the same message). The action is hidden entirely for
 * users who fail the {@link alertsTabEligibility} `ManageAlerts` check, matching
 * the gating applied to the Alerts tab body.
 */
const AlertConfigurationCreateAction: FC<{
  translate: TranslationKeyToFormattedText;
  universeId: number;
}> = ({ translate, universeId }) => {
  const isEligible = useIsPageContentEligible(alertsTabEligibility);
  const { data: alerts, isSuccess } = useAnalyticsAlertsListQuery(universeId);
  const isEmpty = isSuccess && (alerts?.length ?? 0) === 0;
  const isAtCap = isSuccess && (alerts?.length ?? 0) >= MAX_ALERTS_PER_RESOURCE;

  if (!isEligible || isEmpty) {
    return null;
  }

  return (
    <AnalyticsPageAction
      text={translate(translationKey('Action.Create', TranslationNamespace.Analytics))}
      as='a'
      href={creatorHub.dashboard.getExperienceAlertCreateUrl(universeId)}
      isDisabled={isAtCap}
      tooltip={
        isAtCap
          ? getAlertFormValidationErrorMsg(AnalyticsAlertErrorCode.MaxAlertReached, translate)
          : undefined
      }
    />
  );
};

function getAlertConfigurationPageConfig(
  translate: TranslationKeyToFormattedText,
  universeId: number,
): CreatorAnalyticsFixedTabPageConfig<AlertConfigurationPageTab> {
  return {
    mode: CreatorAnalyticsPageMode.FixedTab,
    debugPageName: 'Alerts',
    title: analyticsAlertsNavigationItem.title,
    description: {
      standard: translationKey(
        'Description.AlertConfigurationPage',
        TranslationNamespace.Analytics,
      ),
    },
    action: <AlertConfigurationCreateAction translate={translate} universeId={universeId} />,
    navigationItem: analyticsAlertsNavigationItem,
    docLinks: [alertDocLink],
    eligibility: {
      checkerType: RAQIV2EligibilityChecker.PerformanceMonitoring,
      ineligibleMessage: translationKey(
        'Message.PerformanceNotEnrolled',
        TranslationNamespace.ExperienceAlerts,
      ),
      ignorePreControlComponents: true,
    },
    tabOrder: [AlertConfigurationPageTab.Alerts, AlertConfigurationPageTab.Analytics],
    tabs: {
      [AlertConfigurationPageTab.Alerts]: {
        tabKey: AlertConfigurationPageTab.Alerts,
        resourceTypes: [RAQIV2ChartResourceType.Universe],
        label: translationKey('Heading.Alerts', TranslationNamespace.Navigation),
        filterDimensions: [],
        breakdownDimensions: [],
        timeRangeOptions: { type: 'None' } as const satisfies AnalyticsPageConfigDateOptions,
        surfaceAnnotationOptions: {
          supportedAnnotationTypes: [],
          defaultAnnotationTypes: [],
          showAnnotationsControl: false,
        },
        eligibility: alertsTabEligibility,
        body: [
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [
              {
                type: AnalyticsComponentType.NonGeneric,
                metrics: [],
                renderer: {
                  type: 'isolated',
                  render: () => <AlertConfigurationsTable />,
                },
              },
            ],
          },
        ],
      },
      [AlertConfigurationPageTab.Analytics]: {
        tabKey: AlertConfigurationPageTab.Analytics,
        resourceTypes: [RAQIV2ChartResourceType.Universe],
        label: translationKey('Heading.Analytics', TranslationNamespace.Analytics),
        filterDimensions: [RAQIV2Dimension.AlertId, RAQIV2Dimension.Severity],
        breakdownDimensions: [],
        defaultBreakdown: [],
        timeRangeOptions: {
          type: 'dateRange',
          supportedRanges: [
            RAQIV2DateRangeType.Last1Hour,
            RAQIV2DateRangeType.Last1Day,
            RAQIV2DateRangeType.Last7Days,
            RAQIV2DateRangeType.Last28Days,
            RAQIV2DateRangeType.Custom,
          ],
          defaultRange: RAQIV2DateRangeType.Last1Hour,
          maxStartDateOffsetDays: 28,
        } as const satisfies AnalyticsPageConfigDateOptions,
        surfaceAnnotationOptions: {
          supportedAnnotationTypes: [
            AnnotationType.PlaceVersion,
            AnnotationType.LiveEvent,
            AnnotationType.ConfigVersion,
            AnnotationType.EngineRelease,
            AnnotationType.Announcement,
          ],
          defaultAnnotationTypes: [
            AnnotationType.PlaceVersion,
            AnnotationType.EngineRelease,
            AnnotationType.ConfigVersion,
          ],
          showAnnotationsControl: true,
        } as const satisfies AnalyticsPageConfigAnnotationOptions,
        endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
        eligibility: {
          checkerType: RAQIV2EligibilityChecker.ViewAnalytics,
          ineligibleMessage: translationKey(
            'Message.PermissionDenied',
            TranslationNamespace.ExperienceAlerts,
          ),
          ignorePreControlComponents: true,
        },
        body: [
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [
              {
                type: AnalyticsComponentType.Chart,
                titleKey: translationKey(
                  'Label.Metric.TriggeredAlertsCount',
                  TranslationNamespace.Analytics,
                ),
                metric: RAQIV2Metric.AlertIncidentCount,
                chartType: ChartType.Spline,
                overrides: {},
              },
            ],
          },
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [
              {
                type: AnalyticsComponentType.NonGeneric,
                metrics: [],
                renderer: {
                  type: 'withChartContext',
                  render: (chartContext) => <ActiveAlertsTable chartContext={chartContext} />,
                },
              },
            ],
          },
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [
              {
                type: AnalyticsComponentType.NonGeneric,
                metrics: [],
                renderer: {
                  type: 'withChartContext',
                  render: (chartContext) => <AlertHistoryTable chartContext={chartContext} />,
                },
              },
            ],
          },
        ],
      },
    },
  };
}

export default getAlertConfigurationPageConfig;
