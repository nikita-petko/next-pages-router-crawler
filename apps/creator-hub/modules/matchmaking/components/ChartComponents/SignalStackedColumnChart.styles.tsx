import { makeStyles } from '@rbx/ui';

const useSignalStackedColumnChartStyles = makeStyles()((theme) => ({
  headerContainer: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 10,
  },
  chartTitle: {
    padding: theme.spacing(1, 0),
    display: 'flex',
    fontWeight: 'bold',
  },
  tooltipIconPadding: {
    padding: theme.spacing(1.5, 0, 0, 0.75),
    display: 'flex',
  },
  trophyIcon: {
    marginRight: 5,
    marginBottom: 15,
  },
}));

export default useSignalStackedColumnChartStyles;
