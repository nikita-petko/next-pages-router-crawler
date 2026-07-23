import { useCallback, useMemo } from 'react';
import { numberFormatter } from '@rbx/core';
import { ChartUnit } from '../types/ChartTypes';
import { TimeSeriesChartUnitSpec } from '../types/TimeSeriesTypes';

const useTimeSeriesChartYAxisConfig = ({
  unitSpec,
  showUnitDisplayOnYAxisTitle,
}: {
  unitSpec: TimeSeriesChartUnitSpec;
  showUnitDisplayOnYAxisTitle?: boolean;
}) => {
  const percentFormatter = useCallback(({ value }: { value: string | number }) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${numberFormatter(num, 'percent')}`;
  }, []);

  return useMemo(() => {
    const config = {
      yAxisTitle: showUnitDisplayOnYAxisTitle ? unitSpec.display : undefined,
      decimalPrecision: unitSpec.formattingSpec?.numberFormatOptions.maximumFractionDigits,
    };
    return unitSpec.formattingSpec?.numberFormatOptions.style === 'percent' ||
      // eslint-disable-next-line deprecation/deprecation -- migration in progress. Will be removed in DSA-4660.
      unitSpec.unit === ChartUnit.Percentage
      ? { ...config, yAxisFormatter: percentFormatter }
      : config;
  }, [
    percentFormatter,
    showUnitDisplayOnYAxisTitle,
    unitSpec.display,
    unitSpec.formattingSpec?.numberFormatOptions.maximumFractionDigits,
    unitSpec.formattingSpec?.numberFormatOptions.style,
    // eslint-disable-next-line deprecation/deprecation -- migration in progress. Will be removed in DSA-4660.
    unitSpec.unit,
  ]);
};

export default useTimeSeriesChartYAxisConfig;
