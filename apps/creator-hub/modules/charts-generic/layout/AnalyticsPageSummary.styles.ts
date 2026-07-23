import { makeStyles } from '@rbx/ui';
import { getChartThemedColors } from '../charts/options';

const useAnalyticsPageSummaryStyles = makeStyles()((theme) => ({
  summaryContainer: {
    backgroundColor: getChartThemedColors(theme).background,
    padding: '8px',
    height: '100%',
    ...theme.border.radius.large,
  },

  loadingContainer: {
    height: '115px',
    [theme.breakpoints.up('XXLarge')]: {
      height: '132px',
    },
    [theme.breakpoints.between('XLarge', 'XXLarge')]: {
      height: '120px',
    },
    [theme.breakpoints.down('Large')]: {
      height: '115px',
    },
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  summaryFont: {
    fontSize: '48px',
    fontWeight: 'bold',
    [theme.breakpoints.down('Large')]: {
      fontSize: '36px',
    },
    [theme.breakpoints.down('Medium')]: {
      fontSize: '24px',
    },
    color: getChartThemedColors(theme).summaryText,
  },

  listItem: {
    paddingTop: theme.spacing(0),
    paddingBottom: theme.spacing(0),
  },

  list: {
    paddingTop: theme.spacing(2),
  },
}));

export default useAnalyticsPageSummaryStyles;
