// Renders revenue share allocations as a donut chart with formatted labels and tooltips.
import type { FunctionComponent } from 'react';
import { useCallback, useMemo } from 'react';
import type { ChartColor, SinglePieSeries } from '@rbx/analytics-ui';
import { ChartStyleMode, PieChart } from '@rbx/analytics-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { BASIS_POINTS_PER_PERCENT } from '../interface/RevShareViewModel';
import { formatBasisPoints } from '../utils/revShareUtils';

const CHART_BORDER_WIDTH = 1;
const CHART_HEIGHT = 360;
const DONUT_INNER_SIZE = '65%';

export type PieSlice = {
  id: string;
  name: string;
  value: number;
  color: ChartColor;
};

export type RevSharePieChartProps = {
  slices: PieSlice[];
  centerLabel?: string;
  centerSubLabel?: string;
  showLabels?: boolean;
};

const RevSharePieChart: FunctionComponent<RevSharePieChartProps> = ({
  slices,
  centerLabel,
  centerSubLabel,
  showLabels = true,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const seriesLabel = tPendingTranslation(
    'Revenue share split',
    'Accessible series name for a revenue share agreement pie chart.',
    translationKey('Label.SplitChartSeries', TranslationNamespace.RevenueShareAgreements),
  );
  const series = useMemo((): SinglePieSeries<string, number> => {
    return {
      name: seriesLabel,
      dataPoints: slices.map((slice) => [slice.name, slice.value / BASIS_POINTS_PER_PERCENT]),
      dataPointColors: slices.map((slice) => slice.color),
    };
  }, [seriesLabel, slices]);

  const tooltipFormatters = useMemo(
    () => ({
      formatSeriesKeyForSlice: ({ sliceName }: { sliceName: string }) => sliceName,
      formatSeriesValueForSlice: ({ sliceValue }: { sliceValue: number }) =>
        `${formatBasisPoints(Math.round(sliceValue * BASIS_POINTS_PER_PERCENT))}%`,
    }),
    [],
  );

  const formatDataLabel = useCallback(
    ({ category, y }: { category: string; y: number }) =>
      `${category}\n${formatBasisPoints(Math.round(y * BASIS_POINTS_PER_PERCENT))}%`,
    [],
  );

  return (
    <PieChart
      data={{ series }}
      tooltipFormatters={tooltipFormatters}
      formatDataLabel={showLabels ? formatDataLabel : undefined}
      dataLabelsOutside={showLabels}
      borderColor='var(--color-surface-100)'
      borderWidth={CHART_BORDER_WIDTH}
      chartStyleMode={ChartStyleMode.Minimal}
      height={CHART_HEIGHT}
      donut={{
        innerSize: DONUT_INNER_SIZE,
        centerLabel,
        centerSubLabel,
      }}
    />
  );
};

export default RevSharePieChart;
