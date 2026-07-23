import { makeStyles } from '@rbx/ui';

const fullWidthHeight = {
  width: '100%',
  height: '100%',
};

const useOverviewStyles = makeStyles()((theme) => ({
  title: {
    marginBottom: theme.spacing(1),
  },

  section: {
    ...fullWidthHeight,
    [theme.breakpoints.down('Medium')]: {
      padding: theme.spacing(0, 1),
    },
  },

  overviewContainer: {
    marginTop: 4,
  },

  emptyGrid: {
    minHeight: 450,
  },

  viewOnRobloxIcon: {
    marginLeft: 8,
  },
  eventOverviewContainer: {
    marginBottom: 20,
    marginTop: -12,
  },
}));

export default useOverviewStyles;
