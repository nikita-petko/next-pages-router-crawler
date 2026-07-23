import { makeStyles } from '@rbx/ui';

const useMediaListContainerStyles = makeStyles()((theme) => ({
  list: {
    marginTop: 48,
  },

  title: {
    padding: '12px 16px',
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

  preview: {
    marginBottom: 12,
  },

  error: {
    padding: '4px 12px',
  },
}));

export default useMediaListContainerStyles;
