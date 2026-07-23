import React from 'react';
import {
  AnalyticsComponentType,
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsFixedTabPageConfig,
  CreatorAnalyticsPageMode,
  EndDateBehavior,
  RAQIV2EligibilityChecker,
  RAQIV2SpecialLayoutType,
} from '@modules/experience-analytics-shared';
import {
  analyticsAlertsNavigationItem,
  AnalyticsPageAction,
  ChartType,
  DateRangeType,
} from '@modules/charts-generic';
import { translationKey, TranslationKeyToFormattedText } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { RAQIV2Metric, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { urls } from '@modules/miscellaneous/common';
import AlertConfigurationsTable from './AlertConfigurationsTable';
import ActiveAlertsTable from './ActiveAlertsTable';
import AlertHistoryTable from './AlertHistoryTable';

enum AlertConfigurationPageTab {
  Alerts = 'AlertConfiguration-Alert',
  Analytics = 'AlertConfiguration-Analytics',
}

function getAlertConfigurationPageConfig(
  translate: TranslationKeyToFormattedText,
  id: number,
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
    action: (
      <AnalyticsPageAction
        text={translate(translationKey('Action.Create', TranslationNamespace.Analytics))}
        as='a'
        href={urls.creatorHub.dashboard.getExperienceAlertCreateUrl(id)}
      />
    ),
    navigationItem: analyticsAlertsNavigationItem,
    docLinks: [],
    // TODO(yukihe): update the eligibility check when we finalized the enrollment requirements
    eligibility: {
      checkerType: RAQIV2EligibilityChecker.PerformanceMonitoring,
      ineligibleMessage: translationKey(
        'Message.AlertsNoPermission',
        TranslationNamespace.Analytics,
      ),
      ignorePreControlComponents: true,
    },
    tabOrder: [AlertConfigurationPageTab.Alerts, AlertConfigurationPageTab.Analytics],
    tabs: {
      [AlertConfigurationPageTab.Alerts]: {
        tabKey: AlertConfigurationPageTab.Alerts,
        resourceTypes: [RAQIV2ChartResourceType.Universe],
        label: translationKey('Heading.Alerts', TranslationNamespace.Analytics),
        filterDimensions: [],
        breakdownDimensions: [],
        timeRangeOptions: { type: 'None' } as const satisfies AnalyticsPageConfigDateOptions,
        surfaceAnnotationOptions: {
          supportedAnnotationTypes: [],
          defaultAnnotationTypes: [],
          showAnnotationsControl: false,
        },
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
        // TODO(yukihe): add place alert name filter when ready in backend
        filterDimensions: [],
        breakdownDimensions: [],
        defaultBreakdown: [],
        timeRangeOptions: {
          type: 'dateRange',
          supportedRanges: [
            DateRangeType.Last1Hour,
            DateRangeType.Last1Day,
            DateRangeType.Last7Days,
            DateRangeType.Last28Days,
            DateRangeType.Custom,
          ],
          defaultRange: DateRangeType.Last1Hour,
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
                // TODO(yukihe): update to actual metric when it's ready in backend
                metric: RAQIV2Metric.EconomyTransactionAmount,
                chartType: ChartType.Column,
                overrides: {
                  granularity: {
                    override: RAQIV2MetricGranularity.OneHour,
                  },
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
