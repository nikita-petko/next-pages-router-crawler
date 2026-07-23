import { makeStyles } from '@rbx/ui';

const usePrivacyChoicesFooterLinkStyles = makeStyles()(() => ({
  container: {
    textAlign: 'center',
    paddingTop: '20px',
    paddingBottom: '20px',
    width: '100%',
    marginTop: '0',
    marginBottom: '0',
  },
  link: {
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
    '&:visited': {
      color: 'inherit',
    },
  },
  icon: {
    marginLeft: '8px',
    verticalAlign: 'middle',
    height: '16px',
    width: 'auto',
  },
}));

export default usePrivacyChoicesFooterLinkStyles;
