import { makeStyles } from '@rbx/ui';

const usePerformanceRealtimeCardStyles = makeStyles()((theme) => {
  return {
    card: {
      minWidth: '314px',
      backgroundColor: theme.palette.surface[100],
    },
    cardHeader: {
      padding: '24px 24px 0',
    },
    cardContent: {
      padding: '0',
    },
    cardActions: {
      padding: '24px',
    },
    miniChartContainer: {
      padding: '0 18px 24px',
    },
    summaryItemsContainer: {
      padding: '0 24px',
    },
  };
});

export default usePerformanceRealtimeCardStyles;
