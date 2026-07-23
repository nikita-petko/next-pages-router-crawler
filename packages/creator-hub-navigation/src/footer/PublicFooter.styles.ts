import { makeStyles } from '@rbx/ui';

const usePublicFooterStyles = makeStyles()((theme) => ({
  root: {
    backgroundColor: theme.palette.surface[0],
    width: '100%',
    padding: '0px 24px',
    [theme.breakpoints.down('Medium')]: {
      padding: '24px 24px 0px',
    },
  },
  container: {
    display: 'flex',
    padding: '24px 0px',
    gap: '24px',
    [theme.breakpoints.down('Medium')]: {
      width: '375px',
      flexDirection: 'column',
      gap: '0px',
    },
  },
  accordion: {
    background: 'inherit',
  },
}));

export default usePublicFooterStyles;
