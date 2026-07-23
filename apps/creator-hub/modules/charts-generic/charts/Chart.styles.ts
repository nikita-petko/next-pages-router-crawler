import { makeStyles } from '@rbx/ui';
import { getChartThemedColors, chartDefaultHeight } from './options';

export const useChartErrorStateStyles = makeStyles<{ customChartHeight?: number }>()((
  theme,
  { customChartHeight },
) => {
  return {
    errorState: {
      backgroundColor: getChartThemedColors(theme).background,
      height: `${customChartHeight || chartDefaultHeight}px`,
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  };
});

const useChartStyles = makeStyles()((theme) => {
  return {
    chartBodyContainer: {
      ...theme.border.radius.large,
      overflow: 'hidden',
    },
    headerContainer: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '8px',
    },
    chartTitle: {
      padding: theme.spacing(1, 0),
      display: 'flex',
      fontWeight: 'bold',
    },
    tooltipIconPadding: {
      padding: theme.spacing(0, 0, 0, 0.75),
      display: 'flex',
    },
    chartHeaderRightSideContainer: {
      display: 'flex',
      marginLeft: 'auto',
      gap: '8px',
    },
    chartHeaderContainer: {
      margin: theme.spacing(1, 0, 0),
    },
    secondaryText: {
      padding: theme.spacing(0, 0.5, 1, 0),
      display: 'inline-block',
    },
    warningPadding: {
      padding: theme.spacing(1, 0),
    },
    annotationLegend: {
      backgroundColor: getChartThemedColors(theme).background,
      display: 'flex',
      flexDirection: 'row',
      margin: 0,
      paddingBottom: '20px',
      justifyContent: 'center',
      fontSize: '12px',
    },
    annotationLegendItem: {
      textAlign: 'right',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      margin: '4px 8px',
    },
    annotationLegendItemLine: {
      margin: '0 4px',
    },
  };
});

export default useChartStyles;
