import { makeStyles } from '@rbx/ui';

const useSocialLinkAgeVerificationUpsellBannerStyles = makeStyles()((theme) => ({
  socialLinkExpirationAlertContainer: {
    marginBottom: '16px',
    width: '100%',

    [theme.breakpoints.down('Medium')]: {
      flexWrap: 'wrap',
    },
    '& .MuiAlert-icon': {
      [theme.breakpoints.down('Medium')]: {
        flexBasis: '10%',
        marginRight: 0,
      },
    },
    '& .MuiAlert-message': {
      [theme.breakpoints.down('Medium')]: {
        flexBasis: '90%',
      },
    },

    '& .MuiAlert-action': {
      padding: '8px 0',
      columnGap: '0.5rem',
      paddingLeft: '0.5rem',
      alignItems: 'center',
      flexShrink: 0,
      [theme.breakpoints.down('Medium')]: {
        flexBasis: '100%',
        justifyContent: 'end',
      },
    },
  },
  viewDetails: {
    textDecoration: 'underline',
    whiteSpace: 'nowrap',
  },

  getStarted: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  alertTitle: {
    marginBottom: 8,
  },
}));

export default useSocialLinkAgeVerificationUpsellBannerStyles;
