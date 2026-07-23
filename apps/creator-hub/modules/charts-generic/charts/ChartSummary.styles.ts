import { makeStyles } from '@rbx/ui';
import { getChartThemedColors } from './options';

const useChartSummaryStyles = makeStyles()((theme) => ({
  summaryContainer: {
    backgroundColor: getChartThemedColors(theme).background,
    paddingTop: '8px',
    paddingLeft: '6px',
  },

  list: {
    margin: '0px 8px',
    padding: '12px 6px',
  },

  listItem: {
    margin: 0,
    padding: '0px 8px',
  },

  listItemIcon: {
    minWidth: 34,
  },

  tooltipIconPadding: {
    paddingLeft: '6px',
    lineHeight: `10px`,
    verticalAlign: 'middle',
    display: 'inline-block',
  },

  summaryFont: {
    fontWeight: 'bold',
    textTransform: 'none',
    color: getChartThemedColors(theme).summaryText,
  },

  comparisonChipPadding: {
    paddingLeft: '8px',
  },

  bannerPadding: {
    paddingRight: '24px',
  },
}));

export default useChartSummaryStyles;
