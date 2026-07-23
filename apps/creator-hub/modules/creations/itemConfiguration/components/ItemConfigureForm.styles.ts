/* istanbul ignore file */

import { makeStyles } from '@rbx/ui';
import { imgSize } from '@modules/creations/common/constants/commonConstants';

const useItemConfigureFormStyles = makeStyles()((theme) => ({
  submitButton: {
    margin: '0 12px',
    [theme.breakpoints.down('Large')]: {
      margin: '12px 0',
    },
  },

  descriptionText: {
    paddingBottom: '24px',
    color: 'rgb(187 188 190)',
  },

  pricingHeader: {
    backgroundColor: 'rgb(37 39 44)',
  },

  dynamicPriceText: {
    width: '100%',
    paddingBottom: '16px',
  },

  robuxStyle: {
    verticalAlign: 'middle',
    marginBottom: '5px',
  },

  premiumDiscountText: {
    fontSize: '14px',
    color: 'rgb(187 188 190)',
  },

  priceText: {
    textAlign: 'left',
    display: 'inline-block',
    margin: '10px',
    marginLeft: '0px',
  },

  floorText: {
    textAlign: 'right',
    marginTop: '12px',
    float: 'right',
    color: 'rgb(187 188 190)',
    fontSize: '16px',
  },

  pricingTableTitle: {
    margin: 'auto',
    fontSize: 'large',
    textAlign: 'center',
    paddingBottom: '30px',
  },

  formContainer: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 48,
    },
    [theme.breakpoints.down('Large')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },

  inputForm: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 24,
    },
  },

  earningMessage: {
    paddingLeft: 2,
  },

  errorMessageStyle: {
    width: '100%',
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 14,
    fontWeight: 'bold',
  },

  buttonContainer: {
    padding: '32px 0',
    flexDirection: 'row',
    [theme.breakpoints.down('Large')]: {
      flexDirection: 'column',
    },
  },

  switchPadding: { paddingLeft: 12 },

  itemCardImg: {
    display: 'inline-block',
    width: imgSize,
    height: imgSize,
    borderRadius: 8,
    [theme.breakpoints.down('XLarge')]: {
      display: 'none',
    },
  },

  moderatedCardImg: {
    position: 'relative',
    display: 'inline-block',
    width: imgSize,
    height: imgSize,
    borderRadius: 8,
    [theme.breakpoints.down('XLarge')]: {
      display: 'none',
    },
  },

  regionalPricingPreviewModeratedThumbnailWrapper: {
    position: 'relative',
    display: 'inline-block',
    width: 75,
    height: 75,
    borderRadius: 8,
    marginLeft: '20px',
  },

  itemCardContainer: {
    paddingLeft: 24,
  },

  hidden: {
    [theme.breakpoints.down('XLarge')]: {
      display: 'none',
    },
  },
}));

export default useItemConfigureFormStyles;
