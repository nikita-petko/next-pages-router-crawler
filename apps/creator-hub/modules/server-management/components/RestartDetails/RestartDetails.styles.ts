import { makeStyles } from '@rbx/ui';

const useRestartDetailsStyles = makeStyles()((theme) => ({
  card: {
    padding: theme.spacing(2),
    minHeight: theme.spacing(20),
  },
  title: {
    marginBottom: 6,
  },
  detailsContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    position: 'relative',
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: theme.spacing(0.125),
    backgroundColor: theme.palette.surface.outline,
  },
}));

export default useRestartDetailsStyles;
