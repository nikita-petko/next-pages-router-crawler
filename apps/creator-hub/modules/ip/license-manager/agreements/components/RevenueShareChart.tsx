import type { FunctionComponent } from 'react';
import { useCallback, useMemo } from 'react';
import type { ChartColor, SinglePieSeries } from '@rbx/analytics-ui';
import { ChartStyleMode, PieChart } from '@rbx/analytics-ui';
import { useTranslation } from '@rbx/intl';
import { useTheme } from '@rbx/ui';

export type RevenueShare = {
  splitName: string;
  percentage: number;
  color: ChartColor;
};

interface RevenueShareChartProps {
  revenueShares: RevenueShare[];
}

const DONUT_INNER_SIZE = '70%';
const CHART_HEIGHT = 360;
const CHART_BORDER_WIDTH = 2.5;

const RevenueShareChart: FunctionComponent<RevenueShareChartProps> = ({ revenueShares }) => {
  const { translate } = useTranslation();
  const theme = useTheme();

  const series = useMemo((): SinglePieSeries<string, number> => {
    const visibleShares = revenueShares.filter(
      (share) => !Number.isNaN(share.percentage) && share.percentage > 0,
    );
    return {
      name: translate('Label.TotalRevenueSplits'),
      dataPoints: visibleShares.map((share) => [share.splitName, share.percentage]),
      dataPointColors: visibleShares.map((share) => share.color),
    };
  }, [revenueShares, translate]);

  const tooltipFormatters = useMemo(
    () => ({
      formatSeriesKeyForSlice: ({ sliceName }: { sliceName: string }) => sliceName,
      formatSeriesValueForSlice: ({ percentage }: { percentage: number }) =>
        `${Math.round(percentage)}%`,
    }),
    [],
  );

  const formatDataLabel = useCallback(
    ({ category, percentage }: { category: string; percentage?: number }) =>
      `${category}\n${Math.round(percentage ?? 0)}%`,
    [],
  );

  return (
    <div className='width-full'>
      <PieChart
        data={{ series }}
        tooltipFormatters={tooltipFormatters}
        formatDataLabel={formatDataLabel}
        dataLabelsOutside
        borderColor={theme.palette.surface[0]}
        borderWidth={CHART_BORDER_WIDTH}
        chartStyleMode={ChartStyleMode.Minimal}
        height={CHART_HEIGHT}
        donut={{ innerSize: DONUT_INNER_SIZE }}
      />
    </div>
  );
};

export default RevenueShareChart;
