import { makeStyles } from '@rbx/ui';
import { getChartThemedColors } from '../charts/options';

const useAnalyticsPageStyles = makeStyles()((theme) => {
  const { layoutBackground: background } = getChartThemedColors(theme);
  return {
    descriptionGrid: {
      paddingTop: 8,
      paddingBottom: 20,
      [theme.breakpoints.down('Medium')]: {
        paddingBottom: 5,
      },
    },
    description: {
      display: 'inline',
    },
    tooltipContainer: {
      paddingLeft: 8,
      verticalAlign: 'sub',
      display: 'inline',
    },
    sidePadding: {
      paddingBottom: theme.spacing(4),
      [theme.breakpoints.down('Medium')]: {
        padding: theme.spacing(0, 0, 2),
      },
    },
    menuTab: {
      minWidth: '33.33%',
    },
    alertPadding: {
      padding: theme.spacing(0, 0, 2),
      background,
    },
    dividerStyle: {
      margin: theme.spacing(4, 0),
    },
    heroElementMargin: {
      marginBottom: theme.spacing(4),
    },
    appBarStyles: {
      padding: 0,
      marginBottom: '22px',
      background,
      boxShadow: 'none',
      // Keep analytics sticky bars below Foundation portals (e.g. account switcher at 1050).
      zIndex: theme.zIndex.appBar - 100,
    },
    overflowFix: {
      // Without this, a hero element can overflow above the main container and clobber the description
      overflow: 'hidden',
    },
  };
});

export default useAnalyticsPageStyles;
