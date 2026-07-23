import { makeStyles } from '@rbx/ui';

const usePriceOptimizationPageContentStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  subtitleContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: '8px',
    [theme.breakpoints.down('Large')]: {
      flexDirection: 'column',
      justifyContent: 'flex-start',
    },
  },
  optimizationDate: {
    justifySelf: 'end',
  },
  tabContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  boldText: {
    fontWeight: 'bold',
  },
}));

export default usePriceOptimizationPageContentStyles;
