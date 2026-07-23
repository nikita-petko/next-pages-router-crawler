import { makeStyles } from '@rbx/ui';

const useOverviewTimeLabelStyles = makeStyles()((theme) => ({
  background: {
    padding: theme.spacing(1),
  },

  overviewLabel: {
    marginTop: theme.spacing(0.5),
  },
}));

export default useOverviewTimeLabelStyles;
