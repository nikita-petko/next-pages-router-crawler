import { makeStyles } from '@rbx/ui';

const useRoadMapComingSoonStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    backgroundColor: theme.palette.surface[0],
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    padding: 48,
    alignItems: 'center',
    textAlign: 'center',
  },

  header: {
    marginTop: 12,
  },

  icon: {
    height: 36,
    width: '100%',
  },
}));

export default useRoadMapComingSoonStyles;
