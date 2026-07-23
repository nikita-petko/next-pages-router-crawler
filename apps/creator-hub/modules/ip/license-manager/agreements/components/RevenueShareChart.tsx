import { FunctionComponent, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { makeStyles, useTheme } from '@rbx/ui';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

export type RevenueShare = {
  splitName: string;
  percentage: number;
  color: string;
};

interface RevenueShareChartProps {
  revenueShares: RevenueShare[];
}

const useStyles = makeStyles()(() => ({
  chartContainer: {
    width: '100%',
  },
}));

const RevenueShareChart: FunctionComponent<RevenueShareChartProps> = ({ revenueShares }) => {
  const { translate } = useTranslation();
  const {
    classes: { chartContainer },
  } = useStyles();
  const theme = useTheme();

  const seriesData = useMemo(() => {
    const series = [
      ...revenueShares
        .filter(
          (share) => !Number.isNaN(share.percentage) && share.percentage > 0, // Filter out invalid percentages and zeros
        )
        .map((split) => {
          return {
            name: split.splitName,
            label: split.splitName,
            y: split.percentage,
            color: split.color,
          };
        }),
    ];

    return series;
  }, [revenueShares]);

  const options: Highcharts.Options = useMemo(() => {
    return {
      chart: {
        type: 'pie',
        backgroundColor: undefined,
      },

      title: { style: { display: 'none' } },

      credits: { enabled: false },

      tooltip: {
        headerFormat: '{point.key}<br>',
        pointFormat: '{series.name}: <b>{point.percentage:.0f}%</b>',
      },

      accessibility: {
        point: {
          valueSuffix: '%',
        },
      },

      plotOptions: {
        pie: {
          allowPointSelect: true,
          borderWidth: 2.5,
          borderColor: theme.palette.surface[0],
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.label}</b><br>{point.percentage:.0f}%',
            style: {
              color: theme.palette.content.standard,
              fontSize: '14px',
              fontWeight: '300',
              textOverflow: 'ellipsis',
              overflow: 'allow',
            },
            useHTML: true,
          },
        },
        series: {
          innerSize: '70%',
          borderRadius: 5,
          borderWidth: 1,
        },
      },

      series: [
        {
          type: 'pie',
          name: translate('Label.TotalRevenueSplits'),
          data: seriesData,
        },
      ],
    };
  }, [translate, seriesData, theme]);

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={options}
      allowChartUpdate
      containerProps={{ id: 'revenue-share-chart', className: chartContainer }}
    />
  );
};

export default RevenueShareChart;
