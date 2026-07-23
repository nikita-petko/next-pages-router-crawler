/* istanbul ignore file */

import { makeStyles } from '@rbx/ui';

const useVerificationStyles = makeStyles()((theme) => ({
  alertStyle: {
    width: '100%',
  },
  RegionalPricingBannerContainerWrapper: {
    position: 'relative',
    width: '100%',
  },
  RegionalPricingBannerContainer: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: theme.palette.surface[200],
    borderRadius: '8px',
    maxHeight: '80vh',
    margin: 'auto',
    overflow: 'auto',
    overflowX: 'hidden',
    maxWidth: '100%',
    [theme.breakpoints.down('Small')]: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      padding: '16px',
    },
  },
  RegionalPricingBannerTextContainer: {
    marginLeft: '16px',
    [theme.breakpoints.down('Small')]: {
      marginTop: '8px',
      marginBottom: '16px',
      marginRight: '16px',
      marginLeft: '0',
      width: '100%',
    },
  },
  closeIcon: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    zIndex: 1000,
  },
  RegionalPricingImageContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    maxHeight: '200px',
    [theme.breakpoints.down('Large')]: {
      display: 'none',
    },
    img: {
      height: '100%',
      width: 'auto',
      maxHeight: '200px',
    },
  },
}));

export default useVerificationStyles;
