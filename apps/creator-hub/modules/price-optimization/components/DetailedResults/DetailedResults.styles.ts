import { makeStyles } from '@rbx/ui';

const useDetailedResultsStyles = makeStyles()((theme) => ({
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
  infoBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  recommendationAlert: {
    borderColor: theme.palette.surface.outline,
    backgroundColor: theme.palette.surface[0],
    color: theme.palette.content.standard,
    fontSize: '20px',
  },
  centeredIcon: {
    verticalAlign: 'middle',
  },
  dateRange: {
    fontWeight: 'bold',
  },
}));

export default useDetailedResultsStyles;
