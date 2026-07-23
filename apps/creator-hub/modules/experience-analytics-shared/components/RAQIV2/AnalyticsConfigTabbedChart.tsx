import React, { useMemo } from 'react';

import {
  AnalyticsQueryParams,
  AnalyticsSearchParams,
  DateRangeType,
  NonEmptyArray,
  mapNonEmptyArray,
  buildExperienceAnalyticsUrlWithParams,
  ChartFooter,
  useAnalyticsCurrentDateRangeBundle,
} from '@modules/charts-generic';
import { SelectionCallback } from '@rbx/analytics-ui';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import type { TChartEventLogging } from '../../types/ChartEventLogger';
import type RAQIV2ChartContext from '../../types/RAQIV2ChartContext';
import computeRAQIV2LoggingResourceField from '../../utils/computeRAQIV2LoggingResourceField';
import computeRAQIV2SpecOverride from '../../utils/computeRAQIV2SpecOverride';
import {
  getTabbedConfigFromKeyOrConfig,
  TabbedChartConfigOrPredefinedKey,
} from '../../constants/RAQIV2PredefinedTabbedChartConfig';
import {
  getMetricRelatedConfigFromPredefinedChart,
  getNonMetricRelatedConfigFromPredefinedChart,
  getOverlays,
  getDisplayOptions,
} from '../../constants/RAQIV2PredefinedChartConfig';
import getUniqueKeyForAnalyticsComponent, {
  UniqueKeyForAnalyticsComponent,
} from '../../utils/getUniqueKeyForAnalyticsComponent';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import computeRAQIV2LoggingMetricOverride from '../../utils/computeRAQIV2LoggingMetricOverride';
import GenericRAQIV2TabbedChartsV2, {
  GenericRAQIV2TabbedChartSpec,
} from './GenericRAQIV2TabbedChartsV2';
import getAnalyticsMetricDisplayConfig from '../../constants/AnalyticsMetricDisplayConfig';
import useRAQIV2PredefinedWarnings from '../../hooks/useRAQIV2PredefinedWarnings';
import OnboardingTipsCarousel from '../OnboardingTips/OnboardingTipsCarousel';
import { useAnalyticsChartContainerDragDropContext } from './layout/AnalyticsChartContainerDragDropContext';
import SortableAnalyticsChartContainer from './layout/SortableAnalyticsChartContainer';

type AnalyticsConfigTabbedChartProps = {
  tabbedChartKeyOrConfig: TabbedChartConfigOrPredefinedKey;
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion: null | SelectionCallback<number>;
  eventLogging?: TChartEventLogging;
  chartControl?: React.JSX.Element | null;
};

const buildSearchParamsWithTimeRange = (
  startDate: Date,
  endDate: Date,
  rangeType: DateRangeType,
): AnalyticsSearchParams => {
  return {
    [AnalyticsQueryParams.MaxTime]: endDate.getTime().toString(),
    [AnalyticsQueryParams.MinTime]: startDate.getTime().toString(),
    [AnalyticsQueryParams.RangeType]: rangeType,
  };
};

const AnalyticsConfigTabbedChart = ({
  tabbedChartKeyOrConfig,
  chartContext,
  onSelectChartRegion,
  eventLogging,
  chartControl,
}: AnalyticsConfigTabbedChartProps) => {
  const { startDate, endDate, rangeType } = useAnalyticsCurrentDateRangeBundle();
  const { translate } = useRAQIV2TranslationDependencies();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { tabs, titleKey, definitionTooltipKey, onboardingTipsConfig } =
    getTabbedConfigFromKeyOrConfig(tabbedChartKeyOrConfig);

  const titleSuffix = useMemo(() => {
    if (!onboardingTipsConfig) return undefined;
    return (
      <OnboardingTipsCarousel
        featureKey={onboardingTipsConfig.featureKey}
        stepKey={onboardingTipsConfig.stepKey}
      />
    );
  }, [onboardingTipsConfig]);

  const { resource } = chartContext;
  const resourceLoggingFields = useMemo(() => {
    return computeRAQIV2LoggingResourceField(resource);
  }, [resource]);
  const { id: resourceId } = resource;

  const tabSpecs = useMemo(
    (): NonEmptyArray<GenericRAQIV2TabbedChartSpec<UniqueKeyForAnalyticsComponent>> =>
      mapNonEmptyArray(tabs, (tabSpec) => {
        const { chart, tabLabel, action } = tabSpec;
        const uniqueKey = getUniqueKeyForAnalyticsComponent(chart);
        const partialPredefinedChartConfig = getNonMetricRelatedConfigFromPredefinedChart(chart);
        const [{ metric, overrides: predefinedChartSpecOverride }] =
          getMetricRelatedConfigFromPredefinedChart(chart);
        const chartSpec = computeRAQIV2SpecOverride(
          { ...chartContext, metric },
          predefinedChartSpecOverride,
        );

        const footerProps = action
          ? {
              actionLink: {
                onClick: () => {
                  const { loggingMetricOverride } = getAnalyticsMetricDisplayConfig(metric);
                  const loggingMetric = computeRAQIV2LoggingMetricOverride(
                    metric,
                    loggingMetricOverride,
                  );
                  if (action.actionEventName && loggingMetric) {
                    unifiedLogger.logClickEvent({
                      eventName: action.actionEventName,
                      parameters: {
                        ...resourceLoggingFields,
                        metric: loggingMetric,
                      },
                    });
                  }
                },
                url: buildExperienceAnalyticsUrlWithParams(
                  action.actionTargetNavigationItem,
                  buildSearchParamsWithTimeRange(startDate, endDate, rangeType),
                  resourceId,
                ),
                label: action.actionLabel,
              },
            }
          : undefined;

        const overlays = getOverlays(partialPredefinedChartConfig);
        const displayOptions = getDisplayOptions(partialPredefinedChartConfig);

        const genericTabSpec: GenericRAQIV2TabbedChartSpec<UniqueKeyForAnalyticsComponent> = {
          key: uniqueKey,
          chartKeyOrConfig: chart,
          tabLabel: translate(tabLabel),
          ...partialPredefinedChartConfig,
          spec: chartSpec,
          onSelectChartRegion,
          footerProps,
          eventLogging,
          overlays,
          displayOptions,
        };
        return genericTabSpec;
      }),
    [
      tabs,
      chartContext,
      startDate,
      endDate,
      rangeType,
      resourceId,
      translate,
      onSelectChartRegion,
      eventLogging,
      unifiedLogger,
      resourceLoggingFields,
    ],
  );

  const definitionTooltip = useMemo(
    () => (definitionTooltipKey ? translate(definitionTooltipKey) : undefined),
    [definitionTooltipKey, translate],
  );

  const allChartSpecs = useMemo(() => {
    return tabSpecs.map((tab) => tab.spec);
  }, [tabSpecs]);
  const chartWarnings = useRAQIV2PredefinedWarnings(allChartSpecs);
  const footerContent = useMemo(() => {
    return chartWarnings?.length > 0 ? <ChartFooter warnings={chartWarnings} /> : undefined;
  }, [chartWarnings]);

  const chartContainerId = useMemo(
    () => getUniqueKeyForAnalyticsComponent(tabbedChartKeyOrConfig),
    [tabbedChartKeyOrConfig],
  );
  const dragDropContext = useAnalyticsChartContainerDragDropContext();

  if (!dragDropContext?.isEnabled) {
    return (
      <GenericRAQIV2TabbedChartsV2
        tabs={tabSpecs}
        title={translate(titleKey)}
        definitionTooltip={definitionTooltip}
        titleSuffix={titleSuffix}
        chartControl={chartControl}
        footerContent={footerContent}
      />
    );
  }

  return (
    <SortableAnalyticsChartContainer
      itemId={chartContainerId}
      dropIndicator={dragDropContext.getDropIndicator(chartContainerId)}
      resizeOptions={dragDropContext.getResizeOptions?.(chartContainerId)}>
      <GenericRAQIV2TabbedChartsV2
        tabs={tabSpecs}
        title={translate(titleKey)}
        definitionTooltip={definitionTooltip}
        titleSuffix={titleSuffix}
        chartControl={chartControl}
        footerContent={footerContent}
      />
    </SortableAnalyticsChartContainer>
  );
};

export default AnalyticsConfigTabbedChart;
