import { useMemo } from 'react';
import type { CreditsOptions, LegendOptions, TitleOptions } from 'highcharts';
import { useTheme } from '@rbx/ui';
import { getChartThemedColors } from '../color';
import { ChartStyleMode } from '../types/BaseChart';
import { escapeHtmlFn, escapeHtmlString } from '../utils/escape-html';
import sanitizeImageUrl from '../utils/sanitize-url';

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
          // `imageUrl` and `this.name` can originate from untrusted data
          // (experience metadata). `useHTML: true` means the returned string
          // is injected as raw HTML, so sanitize the URL and HTML-escape the
          // series name before interpolation.
          const safeImageUrl = sanitizeImageUrl(this.options?.custom?.imageUrl);
          if (safeImageUrl) {
            return `<img src="${safeImageUrl}" alt="" style="width: 56px; height: 32px; border: 4px solid white; border-radius: 4px;"/>`;
          }
          return `<div style="max-width: 200px; text-overflow: ellipsis; overflow: hidden">${escapeHtmlString(this.name ?? '')}</div>`;
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Highcharts types the legend `labelFormatter` receiver as `Point | Series`,
 * but map series additionally carry the bucket bounds the label describes.
 * Read them defensively rather than asserting the whole series shape.
 */
const readMapSeriesRange = (series: unknown): { from?: number; to?: number } => {
  if (!isRecord(series)) {
    return {};
  }

  const { from, to } = series;
  return {
    from: typeof from === 'number' ? from : undefined,
    to: typeof to === 'number' ? to : undefined,
  };
};

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
          const { from, to } = readMapSeriesRange(this);
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
