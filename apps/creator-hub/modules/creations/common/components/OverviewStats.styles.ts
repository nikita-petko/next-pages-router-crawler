import { makeStyles } from '@rbx/ui';

const useOverviewStatsStyles = makeStyles()((theme) => ({
  overviewStatContainer: {
    paddingRight: theme.spacing(1),
    width: 'auto',
  },

  overviewStatValue: {
    marginRight: theme.spacing(0.5),
  },
}));

export default useOverviewStatsStyles;
