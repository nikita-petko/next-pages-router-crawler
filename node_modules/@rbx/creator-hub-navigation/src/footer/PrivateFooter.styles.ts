import { makeStyles } from '@rbx/ui';

const usePrivateFooterStyles = makeStyles()((theme) => ({
  root: {
    backgroundColor: theme.palette.surface[0],
    width: '100%',
    [theme.breakpoints.down('Medium')]: {
      padding: '24px',
    },
  },
  container: {
    width: '100%',
    maxWidth: '1920px',
    padding: '24px 0px',
    alignItems: 'center',
    flexWrap: 'nowrap',
    [theme.breakpoints.down('Medium')]: {
      padding: '0px',
      flexDirection: 'column',
      gap: '16px',
    },
  },
  separator: {
    margin: '0 8px',
  },
  companyInfo: {
    display: 'flex',
    flexWrap: 'nowrap',
    marginRight: 'auto',
    gap: '12px',
    [theme.breakpoints.down('Large')]: {
      gap: '0px',
      flexDirection: 'column',
    },
    [theme.breakpoints.down('Medium')]: {
      margin: 'auto',
      alignItems: 'center',
    },
  },
  copyright: {
    [theme.breakpoints.down('Medium')]: {
      textAlign: 'center',
    },
  },
  links: {
    [theme.breakpoints.down('Medium')]: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
  },
  social: {
    margin: '0 24px',
    gap: '12px',
    textAlign: 'end',
    [theme.breakpoints.down('Medium')]: {
      margin: '0px',
    },
  },
}));

export default usePrivateFooterStyles;
