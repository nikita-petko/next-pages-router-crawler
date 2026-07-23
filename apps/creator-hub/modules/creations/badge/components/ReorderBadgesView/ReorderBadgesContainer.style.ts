import { makeStyles } from '@rbx/ui';

const useReorderBadgesContainerStyles = makeStyles()((theme) => ({
  list: {
    paddingTop: '12px',
  },
  infoMessage: {
    paddingTop: '16px',
  },
  divider: {
    marginTop: 48,
    marginBottom: 32,
  },
  button: {
    marginRight: 12,
    [theme.breakpoints.down('Large')]: {
      marginRight: 0,
      marginBottom: 12,
    },
  },
  error: {
    paddingTop: '12px',
  },
  section: {
    [theme.breakpoints.down('Large')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },
}));

export default useReorderBadgesContainerStyles;
