import { makeStyles } from '@rbx/ui';

const useImpersonationBannerStyles = makeStyles()(() => ({
  banner: {
    color: '#F5C73D',
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
      backgroundColor: 'gray[90]',
    },
    backgroundColor: 'gray[100]',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 500,
    margin: '0px 5px',
    padding: '2px 10px',
  },
}));

export default useImpersonationBannerStyles;
