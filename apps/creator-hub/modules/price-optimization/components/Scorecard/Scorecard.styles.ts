import { makeStyles } from '@rbx/ui';

const useScorecardStyles = makeStyles()((theme) => ({
  table: {
    'td, th': {
      backgroundColor: theme.palette.surface[0],
    },
  },
  titleCell: {
    padding: '8px',
  },
  priceGroups: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px',
  },
  cohortCell: {
    textAlign: 'right',
  },
  metricName: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  modeledOutcomeCell: {
    paddingTop: '8px',
    paddingBottom: '8px',
    // Increase specificity to override the background color set for all table cells
    '&&': {
      backgroundColor: theme.palette.surface[100],
    },
  },
  boldText: {
    fontWeight: 'bold',
  },
}));

export default useScorecardStyles;
