import { makeStyles } from '@rbx/ui';

const usePerformanceRealtimeCardStyles = makeStyles()(() => {
  return {
    card: {
      minWidth: '314px',
    },
    cardHeader: {
      padding: 'var(--padding-xlarge) var(--padding-xlarge) 0',
    },
    cardContent: {
      padding: '0',
    },
    cardActions: {
      padding: 'var(--padding-xlarge)',
    },
    miniChartContainer: {
      padding: '0 18px var(--padding-xlarge)',
    },
    summaryItemsContainer: {
      padding: '0 var(--padding-xlarge)',
    },
  };
});

export default usePerformanceRealtimeCardStyles;
