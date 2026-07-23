import { makeStyles } from '@rbx/ui';
import { paymentMethodsSpritePath } from './paymentIconsConstants';

const paymentMethodBase = {
  width: '42px',
  height: '28px',
  top: '3px',
  display: 'inline-block',
  marginRight: '15px',
  backgroundImage: `url(${paymentMethodsSpritePath})`,
  backgroundRepeat: 'no-repeat',
  backgroundPositionX: `0px`,
};
const paymentMethodBaseLargeIcon = {
  width: '100px',
  height: '70px',
  top: '3px',
  display: 'block',
  backgroundImage: `url(${paymentMethodsSpritePath})`,
  backgroundRepeat: 'no-repeat',
  backgroundPositionX: `0px`,
  backgroundSize: '100%',
  marginBottom: '10px',
  marginRight: 'auto',
  marginLeft: 'auto',
};
const paymentMethodBaseSmallIcon = {
  width: '28px',
  height: '20px',
  display: 'block',
  backgroundImage: `url(${paymentMethodsSpritePath})`,
  backgroundRepeat: 'no-repeat',
  backgroundPositionX: `0px`,
  backgroundSize: '100%',
};

const usePaymentMethodIconStyles = makeStyles()(() => ({
  visa: {
    ...paymentMethodBase,
    position: 'relative',
    backgroundPositionY: `-2px`,
  },

  masterCard: {
    ...paymentMethodBase,
    position: 'relative',
    backgroundPositionY: `-34px`,
  },

  discover: {
    ...paymentMethodBase,
    position: 'relative',
    backgroundPositionY: `-66px`,
  },

  americanExpress: {
    ...paymentMethodBase,
    position: 'relative',
    backgroundPositionY: `-98px`,
  },

  debitCard: {
    ...paymentMethodBase,
    position: 'relative',
    backgroundPositionY: `-130px`,
  },

  visaLargeIcon: {
    ...paymentMethodBaseLargeIcon,
    position: 'relative',
    backgroundPositionY: `-2px`,
  },

  masterCardLargeIcon: {
    ...paymentMethodBaseLargeIcon,
    position: 'relative',
    backgroundPositionY: `-75px`,
  },

  discoverLargeIcon: {
    ...paymentMethodBaseLargeIcon,
    position: 'relative',
    backgroundPositionY: `-148px`,
  },

  americanExpressLargeIcon: {
    ...paymentMethodBaseLargeIcon,
    position: 'relative',
    backgroundPositionY: `-221px`,
  },

  debitCardLargeIcon: {
    ...paymentMethodBaseLargeIcon,
    position: 'relative',
    backgroundPositionY: `-294px`,
  },

  visaSmallIcon: {
    ...paymentMethodBaseSmallIcon,
    position: 'relative',
    backgroundPositionY: `-1px`,
  },

  masterCardSmallIcon: {
    ...paymentMethodBaseSmallIcon,
    position: 'relative',
    backgroundPositionY: `-21px`,
  },

  discoverSmallIcon: {
    ...paymentMethodBaseSmallIcon,
    position: 'relative',
    backgroundPositionY: `-41px`,
  },

  americanExpressSmallIcon: {
    ...paymentMethodBaseSmallIcon,
    position: 'relative',
    backgroundPositionY: `-61px`,
  },

  debitCardSmallIcon: {
    ...paymentMethodBaseSmallIcon,
    position: 'relative',
    backgroundPositionY: `-81px`,
  },
}));

export default usePaymentMethodIconStyles;
