import { makeStyles } from '@rbx/ui';

const usePriceOptimizationResultsStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cardGrid: {
    display: 'grid',
    gap: '24px',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    [theme.breakpoints.down('XLarge')]: {
      gridTemplateColumns: '1fr 1fr',
    },
    [theme.breakpoints.down('Large')]: {
      gridTemplateColumns: '1fr',
    },
  },
  mediumCard: {
    gridColumn: 'span 2',
    [theme.breakpoints.down('XLarge')]: {
      gridColumn: 'span 1',
    },
  },
  longCard: {
    gridColumn: 'span 4',
    [theme.breakpoints.down('XLarge')]: {
      gridColumn: 'span 2',
    },
    [theme.breakpoints.down('Large')]: {
      gridColumn: 'span 1',
    },
  },
  subtitleText: {
    fontSize: '20px',
    [theme.breakpoints.up(1440)]: {
      width: '960px',
    },
  },
}));

export default usePriceOptimizationResultsStyles;
