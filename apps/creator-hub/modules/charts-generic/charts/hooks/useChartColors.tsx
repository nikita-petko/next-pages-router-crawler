import { useTheme } from '@rbx/ui';
import { useMemo } from 'react';
import { lightChartColors, darkChartColors } from '../constants';

/**
 * This switches the chart line colors based on the theme mode.
 *
 * For colors that are embedded in the TTheme...
 * See also getChartThemedColors in modules/charts-generic/charts/options.tsx
 */
const useChartColors = () => {
  const theme = useTheme();
  return useMemo(() => {
    // NOTE(gperkins@ 20231115): hardcode themeMode = 'light' in ModeResponsiveThemeProvider to test manually
    return theme.palette.mode === 'light' ? lightChartColors : darkChartColors;
  }, [theme]);
};
export default useChartColors;
