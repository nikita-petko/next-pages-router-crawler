import { makeStyles } from '@rbx/ui';

const useScorecardStyles = makeStyles()((theme) => ({
  table: {
    'td, th': {
      backgroundColor: theme.palette.surface[0],
    },
  },
  metricName: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  boldText: {
    fontWeight: 'bold',
  },
}));

export default useScorecardStyles;
