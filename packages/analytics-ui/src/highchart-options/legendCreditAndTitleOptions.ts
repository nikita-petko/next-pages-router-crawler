import { useTheme } from '@rbx/ui';
import { useMemo } from 'react';
import { CreditsOptions, LegendOptions, Series, TitleOptions } from 'highcharts';
import { ChartStyleMode } from '../types/BaseChart';
import { getChartThemedColors } from '../color';
import { escapeHtmlFn } from '../utils/escape-html';

const useLegendTitleAndCreditOptions = ({
  chartStyleMode,
  forceHideLegends,
}: {
  chartStyleMode: ChartStyleMode;
  forceHideLegends?: boolean;
}): {
  legend: LegendOptions;
  title: TitleOptions;
  credits: CreditsOptions;
} => {
  const theme = useTheme();
  return useMemo(() => {
    return {
      legend: {
        enabled: forceHideLegends ? false : chartStyleMode !== ChartStyleMode.Minimal,
        itemStyle: {
          color: getChartThemedColors(theme).legendText,
          fontSize: '12px',
          fontWeight: '300',
          textOverflow: 'ellipsis',
        },
        navigation: {
          style: {
            color: getChartThemedColors(theme).legendText,
          },
        },
        useHTML: true,
        labelFormatter() {
          if (this.options?.custom?.imageUrl) {
            return `<img src="${this.options.custom.imageUrl}" alt="" style="width: 56px; height: 32px; border: 4px solid white; border-radius: 4px;"/>`;
          }
          return `<div style="max-width: 200px; text-overflow: ellipsis; overflow: hidden">${this.name}</div>`;
        },
        itemHoverStyle: {
          color: getChartThemedColors(theme).legendText,
        },
        spacingBottom: 0,
        paddingBottom: 0,
        // NOTE(shumingxu, 03/01/2024): symbolRadius only applies to series types that use a
        // rectangle in the legend: namely columns, bars, and benchmark areas.
        // Splines are not affected.
        symbolRadius: 0,
      },
      title: { style: { display: 'none' } },
      credits: { enabled: false },
    };
  }, [chartStyleMode, forceHideLegends, theme]);
};

export type MapChartLegendLabelFormatter = ({ from, to }: { from?: number; to?: number }) => string;

interface MapSeries extends Series {
  from?: number;
  to?: number;
}

export const useMapChartLegendTitleAndCreditOptions = ({
  chartStyleMode,
  formatLegendLabel,
}: {
  chartStyleMode: ChartStyleMode;
  formatLegendLabel: MapChartLegendLabelFormatter;
}): {
  legend: LegendOptions;
  title: TitleOptions;
  credits: CreditsOptions;
} => {
  const theme = useTheme();

  return useMemo(() => {
    return {
      legend: {
        enabled: chartStyleMode !== ChartStyleMode.Minimal,
        layout: 'vertical',
        align: 'left',
        verticalAlign: 'bottom',
        floating: true,
        useHTML: true,
        itemStyle: {
          color: getChartThemedColors(theme).legendText,
          fontSize: '12px',
          fontWeight: '300',
          textOverflow: 'ellipsis',
        },
        itemHoverStyle: {
          color: getChartThemedColors(theme).legendText,
        },
        labelFormatter() {
          const { from, to } = this as MapSeries;
          const formattedLabel = escapeHtmlFn(formatLegendLabel)({ from, to });
          return `<div style="max-width: 200px; text-overflow: ellipsis; overflow: hidden">${formattedLabel}</div>`;
        },
        spacingBottom: 0,
        paddingBottom: 0,
        symbolRadius: 0,
        symbolHeight: 15,
      },
      title: { style: { display: 'none' } },
      credits: { enabled: false },
    };
  }, [chartStyleMode, formatLegendLabel, theme]);
};

export default useLegendTitleAndCreditOptions;
