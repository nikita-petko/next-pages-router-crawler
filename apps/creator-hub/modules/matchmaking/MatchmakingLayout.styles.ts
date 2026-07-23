import { makeStyles } from '@rbx/ui';

const useMatchmakingLayoutStyles = makeStyles()((theme) => ({
  title: {
    marginBottom: 20,
  },
  divider: {
    marginBottom: theme.spacing(2),
  },

  hidden: {
    display: 'none',
  },
  container: {
    width: '40%',
  },
  navigation: {
    marginBottom: 30,
  },
}));

export default useMatchmakingLayoutStyles;
