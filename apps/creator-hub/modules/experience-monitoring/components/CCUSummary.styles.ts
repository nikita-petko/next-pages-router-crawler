import { makeStyles } from '@rbx/ui';

const useCCUSummaryStyles = makeStyles<{ large: boolean }>()((theme, { large }) => ({
  breakdownStatsContainerWrapper: {
    minWidth: 'fit-content',
  },

  breakdownStatsContainer: {
    height: '100%',
  },

  summaryItemContainer: {
    padding: large ? '8px 24px' : '8px 8px',
    height: '100%',
  },

  tooltipIconPadding: {
    padding: '0 6px',
    lineHeight: `10px`,
    verticalAlign: 'middle',
    display: 'inline-block',
  },

  serverCountLabel: {
    fontWeight: 'bold',
  },

  numberFont: {
    fontWeight: 'lighter',
    lineHeight: '100%',
    fontSize: large ? '28px' : '24px',
    [theme.breakpoints.up('XXLarge')]: {
      fontSize: '40px',
    },
  },

  totalNumberFont: {
    fontWeight: 'bold',
    lineHeight: '100%',
    fontSize: large ? '48px' : '24px',
  },

  numberContainer: {
    marginTop: '12px',
  },
}));

export default useCCUSummaryStyles;
