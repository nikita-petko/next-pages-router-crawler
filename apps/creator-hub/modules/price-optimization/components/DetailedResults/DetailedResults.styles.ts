import { makeStyles } from '@rbx/ui';

const useDetailedResultsStyles = makeStyles()({
  detailsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  holdoutScorecardContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  dateRange: {
    fontWeight: 'bold',
  },
});

export default useDetailedResultsStyles;
