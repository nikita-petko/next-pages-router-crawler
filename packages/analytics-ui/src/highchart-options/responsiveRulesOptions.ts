import { useTheme } from '@rbx/ui';
import { ResponsiveRulesOptions } from 'highcharts';
import { useMemo } from 'react';
import { getChartThemedColors } from '../color';
import { getPieLabelFontSize } from '../utils/pieLabelUtils';

export const useSmallHeightResponsiveRulesOptions = (): ResponsiveRulesOptions => {
  const theme = useTheme();
  return useMemo(() => {
    const { tooltipBackground } = getChartThemedColors(theme);
    return {
      condition: {
        maxHeight: 150,
      },
      chartOptions: {
        tooltip: {
          // when chart height is small, we want to show tooltip contents in a shared tooltip container
          split: false,
          shared: true,
          backgroundColor: tooltipBackground,
          padding: 0,
          borderRadius: 4,
        },
        // chart is too short to have any annotations rendered
        annotations: undefined,
      },
    };
  }, [theme]);
};

export const useNarrowWidthResponsiveRulesOptions = (): ResponsiveRulesOptions => {
  return useMemo(() => {
    return {
      condition: {
        maxWidth: 400,
      },
      chartOptions: {
        xAxis: {
          labels: {
            // Rotate x-axis labels to prevent label overlap.
            // Note: We do not use autoRotation as it is limited to categorical charts,
            // while most of our charts use time series data.
            rotation: -45,
          },
        },
      },
    };
  }, []);
};

export const usePieChartResponsiveRulesOptions = (): ResponsiveRulesOptions[] => {
  return useMemo(() => {
    return [
      // Large screens - full size labels
      {
        condition: {
          minWidth: 600,
        },
        chartOptions: {
          plotOptions: {
            pie: {
              dataLabels: {
                style: {
                  fontSize: `${getPieLabelFontSize(600, 600)}px`,
                  fontWeight: '400',
                },
              },
            },
          },
        },
      },
      // Medium screens - smaller labels
      {
        condition: {
          minWidth: 400,
          maxWidth: 599,
        },
        chartOptions: {
          plotOptions: {
            pie: {
              dataLabels: {
                style: {
                  fontSize: `${getPieLabelFontSize(400, 400)}px`,
                  fontWeight: '400',
                },
              },
            },
          },
        },
      },
      // Small screens - even smaller labels
      {
        condition: {
          minWidth: 300,
          maxWidth: 399,
        },
        chartOptions: {
          plotOptions: {
            pie: {
              dataLabels: {
                style: {
                  fontSize: `${getPieLabelFontSize(300, 300)}px`,
                  fontWeight: '500',
                },
              },
            },
          },
        },
      },
      // Very small screens - minimal labels
      {
        condition: {
          maxWidth: 299,
        },
        chartOptions: {
          plotOptions: {
            pie: {
              dataLabels: {
                style: {
                  fontSize: `${getPieLabelFontSize(299, 299)}px`,
                  fontWeight: '600',
                },
              },
            },
          },
        },
      },
      // Small height - disable labels to prevent overcrowding
      {
        condition: {
          maxHeight: 200,
        },
        chartOptions: {
          plotOptions: {
            pie: {
              dataLabels: {
                enabled: false,
              },
            },
          },
        },
      },
    ];
  }, []);
};
