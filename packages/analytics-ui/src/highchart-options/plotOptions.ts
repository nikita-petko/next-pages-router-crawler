import { useMemo } from 'react';
import type { DataLabelsFormatterCallbackFunction, PlotOptions } from 'highcharts';
import type { TIconProps } from '@rbx/ui';
import { useTheme } from '@rbx/ui';
import { getChartThemedColors } from '../color';
import type { DataLabelsFormatter } from '../formatters/dataLabelsFormatters';
import {
  useBarChartDataLabelsFormatter,
  usePieChartDataLabelsFormatter,
  useTreemapDataLabelsFormatter,
} from '../formatters/dataLabelsFormatters';
import type { OnTreemapRootNodeChanged } from '../types/TreemapChart';
import {
  canPieLabelFit,
  getPieLabelFontSize,
  PIE_LABEL_DISTANCE_PERCENTAGE,
  PIE_LABEL_FONT_SIZE,
  PIE_OUTSIDE_LABEL_DISTANCE,
  PIE_OUTSIDE_LABEL_SIZE,
} from '../utils/pieLabelUtils';

let treemapLayoutFixTimeout: ReturnType<typeof setTimeout>;

export const useLineChartPlotOptions = (): PlotOptions =>
  useMemo(() => ({ series: { marker: { enabledThreshold: 4 } } }), []);

export const useAreaChartPlotOptions = (): PlotOptions =>
  useMemo(
    () => ({
      area: {
        stacking: 'normal',
      },
    }),
    [],
  );

export const useColumnChartPlotOptions = ({ stacking }: { stacking: boolean }): PlotOptions => {
  return useMemo(
    () => ({
      column: {
        stacking: stacking ? 'normal' : undefined,
        borderWidth: 0,
      },
    }),
    [stacking],
  );
};

export const useBarChartPlotOptions = ({
  formatDataLabel,
  DataLabelLeadingIcon,
}: {
  formatDataLabel?: DataLabelsFormatter;
  DataLabelLeadingIcon?: React.FC<TIconProps>;
}): PlotOptions => {
  const theme = useTheme();
  // If formatDataLabel is not provided, we don't want to show data labels
  const dataLabelsEnabled = !!formatDataLabel;

  const dataLabelsFormatter = useBarChartDataLabelsFormatter({
    formatDataLabel,
    LeadingIcon: DataLabelLeadingIcon,
  });

  return useMemo(
    () => ({
      bar: {
        grouping: false,
        dataLabels: {
          enabled: dataLabelsEnabled,
          style: {
            color: getChartThemedColors(theme).dataLabelText,
            fontSize: '14px',
            fontWeight: '300',
            display: 'inline-flex',
            alignItems: 'center',
          },
          crop: false,
          overflow: 'allow',
          useHTML: true,
          formatter: dataLabelsFormatter,
          position: 'right',
          defer: true,
        },
        pointWidth: 8,
        borderRadius: 2,
        borderWidth: 0,
      },
    }),
    [dataLabelsEnabled, dataLabelsFormatter, theme],
  );
};

export const useMapChartPlotOptions = (): PlotOptions => {
  return useMemo(
    () => ({
      map: {
        states: {
          inactive: {
            enabled: false,
          },
        },
      },
    }),
    [],
  );
};

export const usePieChartPlotOptions = ({
  formatDataLabel,
  DataLabelLeadingIcon,
  borderColor,
  borderWidth,
  innerSize,
  dataLabelsOutside,
}: {
  formatDataLabel?: DataLabelsFormatter;
  DataLabelLeadingIcon?: React.FC<TIconProps>;
  borderColor?: string;
  borderWidth?: number;
  innerSize?: string;
  dataLabelsOutside?: boolean;
} = {}): PlotOptions => {
  const theme = useTheme();
  // Only enable data labels if a formatter is provided
  const dataLabelsEnabled = !!formatDataLabel;

  const dataLabelsFormatter = usePieChartDataLabelsFormatter({
    formatDataLabel,
    LeadingIcon: DataLabelLeadingIcon,
  });

  const { dataLabelText } = getChartThemedColors(theme);

  return useMemo(
    () => ({
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        size: dataLabelsOutside ? PIE_OUTSIDE_LABEL_SIZE : '100%',
        innerSize,
        borderColor: borderColor ?? 'transparent',
        borderWidth: borderWidth ?? (borderColor ? 1 : 0),
        borderRadius: 0,
        dataLabels: {
          enabled: dataLabelsEnabled,
          inside: !dataLabelsOutside,
          distance: dataLabelsOutside
            ? PIE_OUTSIDE_LABEL_DISTANCE
            : `-${PIE_LABEL_DISTANCE_PERCENTAGE}%`,
          useHTML: true,
          crop: false, // Never crop labels
          overflow: 'allow', // Allow overflow instead of ellipses
          style: {
            fontSize: PIE_LABEL_FONT_SIZE,
            fontWeight: '400',
            whiteSpace: dataLabelsOutside ? 'normal' : 'nowrap',
            textOverflow: 'unset', // Disable ellipses
            // Inside the pie, Highcharts' default `contrast` color keeps labels readable against
            // the slice fill. Outside the pie there is no fill to contrast with, so that default
            // resolves to an invisible color and the text has to be themed explicitly.
            ...(dataLabelsOutside ? { color: dataLabelText, textOutline: 'none' } : {}),
          },
          formatter(this, dataLabelsOptions) {
            // Get the formatted text first using the bound formatter context
            const formattedText = dataLabelsFormatter.call(this, dataLabelsOptions);
            if (!formattedText && formattedText !== 0) {
              return null;
            }

            const formattedTextWithLineBreaks =
              typeof formattedText === 'string'
                ? formattedText.replaceAll('\n', '<br>')
                : formattedText;

            if (dataLabelsOutside) {
              return formattedTextWithLineBreaks;
            }

            // Calculate responsive font size based on chart dimensions
            const { plotWidth, plotHeight } = this.series.chart;
            const responsiveFontSize = getPieLabelFontSize(plotWidth, plotHeight);

            // Check if the formatted label can fit in the slice with responsive font size and border width
            try {
              if (
                !canPieLabelFit(
                  this,
                  this.series.chart,
                  formattedText,
                  responsiveFontSize,
                  borderWidth,
                )
              ) {
                return null;
              }
            } catch {
              return null;
            }

            // Return the formatted text if it fits
            return formattedTextWithLineBreaks;
          },
        },
        showInLegend: true,
      },
    }),
    [
      dataLabelsEnabled,
      dataLabelsFormatter,
      dataLabelsOutside,
      dataLabelText,
      innerSize,
      borderColor,
      borderWidth,
    ],
  );
};

export const useTreemapPlotOptions = ({
  formatDataLabel,
  onRootNodeChanged,
}: {
  formatDataLabel?: DataLabelsFormatter;
  onRootNodeChanged?: OnTreemapRootNodeChanged;
}): PlotOptions => {
  const theme = useTheme();

  const dataLabelsFormatter: DataLabelsFormatterCallbackFunction = useTreemapDataLabelsFormatter({
    formatDataLabel,
  });

  return useMemo(
    () => ({
      treemap: {
        allowTraversingTree: true,
        alternateStartingDirection: true,
        levelIsConstant: false,
        borderWidth: 2,
        borderRadius: 3,
        borderColor: theme.palette.surface[0],
        nodeSizeBy: 'leaf',
        animationLimit: 100,
        layoutAlgorithm: 'squarified',
        dataLabels: {
          enabled: true,
          style: {
            color: theme.palette.content.standard,
            textOutline: 'none',
          },
          useHTML: true,
          formatter: dataLabelsFormatter,
        },
        levels: [
          {
            level: 1,
            dataLabels: {
              enabled: true,
              headers: true,
            },
          },
          {
            level: 2,
            dataLabels: {
              enabled: true,
              headers: true,
            },
          },
        ],
        events: {
          setRootNode(
            this: { chart: Highcharts.Chart },
            e: { newRootId?: string; previousRootId?: string; trigger?: string },
          ) {
            onRootNodeChanged?.({
              newRootId: e.newRootId ?? '',
              previousRootId: e.previousRootId,
              trigger: e.trigger,
            });

            // When the user drills down/up (breadcrumb click), Highcharts treemap can end up with
            // incorrect layout (tiles mis-sized or overlapping). Scheduling a delayed full chart
            // update forces a correct re-layout. We skip when trigger is 'layoutFix' to avoid
            // re-entrancy from our own update; the double update (sync + rAF) ensures layout
            // is recalculated after the browser has painted.
            if (e.trigger === 'layoutFix') {
              return;
            }
            const { chart } = this;
            clearTimeout(treemapLayoutFixTimeout);
            treemapLayoutFixTimeout = setTimeout(() => {
              chart.update(
                { plotOptions: { treemap: { dataLabels: { enabled: true } } } },
                true,
                true,
                false,
              );
              requestAnimationFrame(() => {
                chart.update({}, true, true, false);
              });
            }, 500);
          },
        },
      },
    }),
    [theme, dataLabelsFormatter, onRootNodeChanged],
  );
};
