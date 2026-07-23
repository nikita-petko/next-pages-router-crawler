import type { FC, ReactNode } from 'react';
import type useDurationChartData from '../../hooks/useDurationChartData';
import type GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import RAQIV2SingleChartCard from './RAQIV2SingleChartCard';
import useMetricOwnershipWatermarkSlots from './useMetricOwnershipWatermarkSlots';

type DurationChartCardWrapperProps = {
  chartProps: GenericRAQIV2ChartProps;
  hookData: ReturnType<typeof useDurationChartData>;
  children: ReactNode;
};

const DurationChartCardWrapper: FC<DurationChartCardWrapperProps> = ({
  chartProps,
  hookData,
  children,
}) => {
  const { titleKey, definitionTooltipKey, chartControl, chartBanner, chartWarnings, footerProps } =
    chartProps;
  const ownershipWatermarkSlots = useMetricOwnershipWatermarkSlots(chartProps.spec);
  const { translationDependencies, chartSummarySpecs, metricLabel, exporter, abnormalState } =
    hookData;

  return (
    <RAQIV2SingleChartCard
      titleLabel={titleKey ? translationDependencies.translate(titleKey) : ''}
      titleTooltipLabel={
        definitionTooltipKey ? translationDependencies.translate(definitionTooltipKey) : undefined
      }
      chartSummarySpecs={chartSummarySpecs}
      chartKeyOrConfig={chartProps.chartKeyOrConfig}
      spec={chartProps.spec}
      kpiType={metricLabel}
      exporter={exporter}
      chartLocation={chartProps.chartLocation}
      chartControl={chartControl}
      chartBanner={chartBanner}
      chartWarnings={chartWarnings}
      footerProps={footerProps}
      abnormalState={abnormalState}
      slots={ownershipWatermarkSlots}>
      {children}
    </RAQIV2SingleChartCard>
  );
};

export default DurationChartCardWrapper;
