// Renders revenue share allocations as an accessible donut chart with formatted labels and tooltips.
import type { FunctionComponent } from 'react';
import { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { BASIS_POINTS_PER_PERCENT } from '../interface/RevShareViewModel';
import { formatBasisPoints } from '../utils/revShareUtils';
const CHART_BORDER_RADIUS = 4;
const CHART_BORDER_WIDTH = 1;
const CHART_DATA_LABEL_DISTANCE = 12;

export type PieSlice = {
  id: string;
  name: string;
  value: number;
  color: string;
};

export type RevSharePieChartProps = {
  slices: PieSlice[];
  centerLabel?: string;
  centerSubLabel?: string;
  showLabels?: boolean;
  accessibleLabel?: string;
};

const RevSharePieChart: FunctionComponent<RevSharePieChartProps> = ({
  slices,
  centerLabel,
  centerSubLabel,
  showLabels = true,
  accessibleLabel,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const chartLabel =
    accessibleLabel ??
    tPendingTranslation(
      'Revenue share split chart',
      'Accessible description for a pie chart showing each party percentage in a revenue share agreement.',
      translationKey('Label.SplitChart', TranslationNamespace.RevenueShareAgreements),
    );
  const seriesLabel = tPendingTranslation(
    'Revenue share split',
    'Accessible series name for a revenue share agreement pie chart.',
    translationKey('Label.SplitChartSeries', TranslationNamespace.RevenueShareAgreements),
  );
  const seriesData = useMemo(
    () =>
      slices.map((slice) => ({
        id: slice.id,
        name: slice.name,
        y: slice.value / BASIS_POINTS_PER_PERCENT,
        color: slice.color,
      })),
    [slices],
  );

  const options = useMemo(
    (): Highcharts.Options => ({
      chart: { type: 'pie', backgroundColor: 'transparent' },
      title: { text: undefined },
      credits: { enabled: false },
      accessibility: {
        description: chartLabel,
        point: {
          valueSuffix: '%',
        },
      },
      tooltip: {
        headerFormat: '',
        pointFormatter() {
          const formattedValue = `${formatBasisPoints(
            Math.round((this.y ?? 0) * BASIS_POINTS_PER_PERCENT),
          )}%`;
          return `${this.name}: <b>${formattedValue}</b>`;
        },
      },
      plotOptions: {
        pie: {
          allowPointSelect: false,
          innerSize: '65%',
          size: '75%',
          borderRadius: CHART_BORDER_RADIUS,
          borderWidth: CHART_BORDER_WIDTH,
          borderColor: 'var(--color-surface-100)',
          dataLabels: {
            enabled: showLabels,
            distance: CHART_DATA_LABEL_DISTANCE,
            overflow: 'allow',
            crop: false,
            connectorWidth: CHART_BORDER_WIDTH,
            connectorColor: 'var(--color-stroke-default)',
            formatter() {
              const formattedValue = `${formatBasisPoints(
                Math.round((this.y ?? 0) * BASIS_POINTS_PER_PERCENT),
              )}%`;
              return `<b>${this.key ?? ''}</b><br>${formattedValue}`;
            },
            style: {
              fontSize: '12px',
              fontWeight: '400',
              textOverflow: 'ellipsis',
              color: 'var(--color-content-default)',
              textShadow: 'none',
            },
            useHTML: false,
          },
        },
      },
      series: [
        {
          type: 'pie',
          name: seriesLabel,
          data: seriesData,
        },
      ],
    }),
    [chartLabel, seriesData, seriesLabel, showLabels],
  );

  return (
    <div className='relative flex justify-center width-full'>
      <HighchartsReact highcharts={Highcharts} options={options} />
      {(centerLabel ?? centerSubLabel) && (
        <div
          className='absolute [inset:0] flex flex-col items-center justify-center [pointer-events:none]'
          aria-hidden>
          {centerSubLabel && (
            <Typography variant='h6' className='content-muted text-align-x-center'>
              {centerSubLabel}
            </Typography>
          )}
          {centerLabel && (
            <Typography variant='h1' className='text-align-x-center'>
              {centerLabel}
            </Typography>
          )}
        </div>
      )}
    </div>
  );
};

export default RevSharePieChart;
