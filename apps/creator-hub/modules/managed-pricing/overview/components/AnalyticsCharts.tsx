/* istanbul ignore file */
import { useMemo } from 'react';
import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import type { TSystemBannerProps } from '@rbx/foundation-ui';
import { useTranslation, useLocalization } from '@rbx/intl';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import AnalyticsComponent from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsComponent';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import type { TabbedChartConfig } from '@modules/experience-analytics-shared/types/RAQIV2TabbedChartConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTabs } from '@modules/monetization-shared/tabs/useTabs';
import { MANAGED_PRICING_TABS } from '../../types';
import getManagedPricingAnalyticsTimeSpec from '../getManagedPricingAnalyticsTimeSpec';
import { useLowPayerPenetrationCountries } from '../hooks/useLowPayerPenetrationCountries';

function AnalyticsCharts({ universeId }: { universeId: number }) {
  const locale = useLocalization().locale ?? undefined;
  const { translate } = useTranslation();

  const { setActiveTab } = useTabs(MANAGED_PRICING_TABS);

  const chartContext: RAQIV2ChartContext = useMemo(() => {
    return {
      resource: { type: RAQIV2ChartResourceType.Universe, id: universeId },
      timeSpec: getManagedPricingAnalyticsTimeSpec(),
      granularity: RAQIV2MetricGranularity.None,
      timeAxisBounds: 'disabled',
    };
  }, [universeId]);

  const {
    lowPayerPenetrationProportion,
    lowPayerPenetrationThreshold,
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
      !isPayerPenetrationLoading &&
      !isPayerPenetrationError &&
      lowPayerPenetrationProportion > 0 &&
      lowPayerPenetrationThreshold > 0
        ? ({
            /* TranslationNamespace.ManagedPricing */
            title: translate('Heading.AnalyticsRecommendationBanner'),
            description: translate('Description.AnalyticsRecommendationBanner', {
              lowPayerProportion: percentageFormatter.format(lowPayerPenetrationProportion),
              lowPayerThreshold: percentageFormatter.format(lowPayerPenetrationThreshold),
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
      chartType: ChartType.Bar,
      titleKey: translationKey('Label.PayerDistribution', TranslationNamespace.ManagedPricing),
      definitionTooltipKey: translationKey(
        'Description.TopUsersByCountry',
        TranslationNamespace.Analytics,
      ),
      overrides: {
        breakdown: { override: [RAQIV2UIPseudoDimension.TopCountries] },
      },
      labelDataAsPercent: false,
      chartBanner: bannerConfig,
    } as const satisfies ChartConfig;

    const mauConfig = {
      type: AnalyticsComponentType.Chart,
      chartKey: undefined,
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
    lowPayerPenetrationThreshold,
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
