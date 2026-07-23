import { DataLabelsFormatterCallbackFunction, PlotOptions } from 'highcharts';
import { useMemo } from 'react';
import { TIconProps, useTheme } from '@rbx/ui';
import { getChartThemedColors } from '../color';
import {
  DataLabelsFormatter,
  useBarChartDataLabelsFormatter,
  usePieChartDataLabelsFormatter,
  useTreemapDataLabelsFormatter,
} from '../formatters/dataLabelsFormatters';
import type { OnTreemapRootNodeChanged } from '../types/TreemapChart';
import {
  canPieLabelFit,
  getPieLabelFontSize,
  PIE_LABEL_DISTANCE_PERCENTAGE,
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
}: {
  formatDataLabel?: DataLabelsFormatter;
  DataLabelLeadingIcon?: React.FC<TIconProps>;
  borderColor?: string;
  borderWidth?: number;
} = {}): PlotOptions => {
  // Only enable data labels if a formatter is provided
  const dataLabelsEnabled = !!formatDataLabel;

  const dataLabelsFormatter = usePieChartDataLabelsFormatter({
    formatDataLabel,
    LeadingIcon: DataLabelLeadingIcon,
  });

  return useMemo(
    () => ({
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        size: '100%',
        borderColor: borderColor || 'transparent',
        borderWidth: borderWidth ?? (borderColor ? 1 : 0),
        borderRadius: 0,
        dataLabels: {
          enabled: dataLabelsEnabled,
          inside: true,
          distance: `-${PIE_LABEL_DISTANCE_PERCENTAGE}%`, // Use percentage for proportional scaling
          useHTML: true,
          crop: false, // Never crop labels
          overflow: 'allow', // Allow overflow instead of ellipses
          style: {
            fontSize: '16px',
            fontWeight: '400',
            whiteSpace: 'nowrap', // Prevent text wrapping
            textOverflow: 'unset', // Disable ellipses
          },
          formatter(this, dataLabelsOptions) {
            // Get the formatted text first using the bound formatter context
            const formattedText = dataLabelsFormatter.call(this, dataLabelsOptions);
            if (!formattedText && formattedText !== 0) {
              return null;
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
            return formattedText;
          },
        },
        showInLegend: true,
      },
    }),
    [dataLabelsEnabled, dataLabelsFormatter, borderColor, borderWidth],
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
            if (e.trigger === 'layoutFix') return;
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
