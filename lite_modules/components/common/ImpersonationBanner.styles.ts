import { makeStyles } from '@rbx/ui';

const useImpersonationBannerStyles = makeStyles()((theme) => ({
  banner: {
    color: theme.palette.content.alert.notice,
    fontWeight: 500,
  },

  bannerContainer: {
    margin: '5px 16px',
  },

  flagSelector: {
    paddingTop: '20px',
  },

  impersonateForm: {
    paddingTop: '20px',
  },

  impersonationButton: {
    '&:hover': {
      backgroundColor: theme.palette.surface[400],
    },
    // Previously `'gray[100]'`, which is not valid CSS and resolved to nothing.
    backgroundColor: theme.palette.surface[300],
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 500,
    margin: '0px 5px',
    padding: '2px 10px',
  },
}));

export default useImpersonationBannerStyles;
