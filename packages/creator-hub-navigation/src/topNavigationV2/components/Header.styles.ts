import { makeStyles } from '@rbx/ui';

const useStyles = makeStyles()((theme) => ({
  heading: {
    whiteSpace: 'nowrap',
    padding: '0 20px 0 0',
    [theme.breakpoints.down('XLarge')]: {
      padding: '0 16px 0 6px',
    },
  },
  link: {
    display: 'flex',
    color: theme.palette.text.primary,
    justifyContent: 'center',
    alignItems: 'center',
    '&:hover': {
      textDecoration: 'none',
    },
  },
}));

export default useStyles;
