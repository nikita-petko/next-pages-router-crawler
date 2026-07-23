/* istanbul ignore file */
import React, { useMemo } from 'react';
import {
  RAQIV2Dimension,
  RAQIV2FilterOperation,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import type { TSystemBannerProps } from '@rbx/foundation-ui';
import { useTranslation, useLocalization } from '@rbx/intl';
import { translationKey } from '@modules/analytics-translations';
import { ChartType } from '@modules/charts-generic';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import {
  AnalyticsComponent,
  AnalyticsComponentType,
  type ChartConfig,
  type RAQIV2ChartContext,
  RAQIV2PredefinedChartKey,
  RAQIV2SummaryType,
  type TabbedChartConfig,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTabs } from '@modules/monetization-shared/tabs/useTabs';
import { MANAGED_PRICING_TABS } from '@modules/managed-pricing/types';
import {
  DEFAULT_AGGREGATION_DURATION_MS,
  DEFAULT_LOW_PAYER_PENETRATION_THRESHOLD,
  LOW_POPULATION_LOCATIONS,
} from '../constants';
import useLowPayerPenetrationCountries from '../hooks/useLowPayerPenetrationCountries';

function AnalyticsCharts({ universeId }: { universeId: number }) {
  const locale = useLocalization().locale ?? undefined;
  const { translate } = useTranslation();

  const { setActiveTab } = useTabs(MANAGED_PRICING_TABS);

  const chartContext: RAQIV2ChartContext = useMemo(() => {
    return {
      resource: { type: RAQIV2ChartResourceType.Universe, id: universeId },
      timeSpec: {
        startTime: new Date(Date.now() - DEFAULT_AGGREGATION_DURATION_MS),
        endTime: new Date(),
      },
      granularity: RAQIV2MetricGranularity.None,
      timeAxisBounds: 'disabled',
    };
  }, [universeId]);

  const {
    lowPayerPenetrationProportion,
    isLoading: isPayerPenetrationLoading,
    isError: isPayerPenetrationError,
  } = useLowPayerPenetrationCountries({
    universeId,
  });

  const chartConfig = useMemo(() => {
    const percentageFormatter = new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const bannerConfig =
      !isPayerPenetrationLoading && !isPayerPenetrationError && lowPayerPenetrationProportion > 0
        ? ({
            /* TranslationNamespace.ManagedPricing */
            title: translate('Heading.AnalyticsRecommendationBanner'),
            description: translate('Description.AnalyticsRecommendationBanner', {
              lowPayerProportion: percentageFormatter.format(lowPayerPenetrationProportion),
              lowPayerThreshold: percentageFormatter.format(
                DEFAULT_LOW_PAYER_PENETRATION_THRESHOLD,
              ),
            }),
            showIcon: true,
            primaryActionLabel: translate('Action.AddItems'),
            onPrimaryAction: () => setActiveTab('manage-items'),
            className: 'margin-medium !bg-none stroke-standard stroke-muted',
          } as const satisfies TSystemBannerProps)
        : undefined;

    const payerConversionConfig = {
      type: AnalyticsComponentType.Chart,
      chartKey: undefined,
      metric: RAQIV2Metric.PayingUsersCVR,
      chartType: ChartType.Map,
      titleKey: translationKey('Label.PayerDistribution', TranslationNamespace.ManagedPricing),
      definitionTooltipKey: translationKey(
        'Description.TopUsersByCountry',
        TranslationNamespace.Analytics,
      ),
      overrides: {
        breakdown: { override: [RAQIV2Dimension.Country] },
        filter: {
          override: [
            {
              dimension: RAQIV2Dimension.Country,
              values: LOW_POPULATION_LOCATIONS,
              operation: RAQIV2FilterOperation.NotContains,
            },
          ],
        },
      },
      sort: { byBreakdownTotal: true },
      breakdownLimit: 10,
      labelDataAsPercent: false,
      mapLegendSplits: [2, 4, 8, 16],
      summarySpec: {
        totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
        perBreakdownSummaryTypes: [],
        aggregatedBreakdownSummaryTypes: [],
      },
      chartBanner: bannerConfig,
    } as const satisfies ChartConfig;

    const mauConfig = {
      type: AnalyticsComponentType.Chart,
      chartKey: RAQIV2PredefinedChartKey.AudienceCountry,
      metric: RAQIV2Metric.DailyActiveUsers,
      chartType: ChartType.Map,
      titleKey: translationKey('Label.UserDistribution', TranslationNamespace.ManagedPricing),
      definitionTooltipKey: translationKey(
        'Description.TopUsersByCountry',
        TranslationNamespace.Analytics,
      ),
      overrides: { breakdown: { override: [RAQIV2Dimension.Country] } },
      sort: { byBreakdownTotal: true },
      breakdownLimit: 10,
      labelDataAsPercent: true,
      mapLegendSplits: [2, 4, 8, 16],
      chartBanner: bannerConfig,
    } as const satisfies ChartConfig;

    const tabbedChartConfig = {
      type: AnalyticsComponentType.TabbedChart,
      chartKey: undefined,
      titleKey: translationKey(
        'Heading.PayerDistributionCharts',
        TranslationNamespace.ManagedPricing,
      ),
      definitionTooltipKey: translationKey(
        'Description.TopUsersByCountry',
        TranslationNamespace.Analytics,
      ),
      tabs: [
        {
          chart: payerConversionConfig,
          tabLabel: translationKey('Label.PayerDistribution', TranslationNamespace.ManagedPricing),
        },
        {
          chart: mauConfig,
          tabLabel: translationKey('Label.UserDistribution', TranslationNamespace.ManagedPricing),
        },
      ],
    } as const satisfies TabbedChartConfig;

    return tabbedChartConfig;
  }, [
    isPayerPenetrationError,
    isPayerPenetrationLoading,
    locale,
    lowPayerPenetrationProportion,
    setActiveTab,
    translate,
  ]);

  return (
    <AnalyticsComponent
      config={chartConfig}
      chartContext={chartContext}
      onSelectChartRegion={null}
    />
  );
}

export default AnalyticsCharts;
