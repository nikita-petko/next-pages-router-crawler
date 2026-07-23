import { makeStyles } from '@rbx/ui';

const paymentMethodsSpritePath = `${process.env.assetPathPrefix}/common/payment_methods.svg`;

const paymentMethodBase = {
  backgroundImage: `url(${paymentMethodsSpritePath})`,
  backgroundPositionX: '0px',
  backgroundRepeat: 'no-repeat',
  display: 'inline-block',
  height: '28px',
  marginRight: '15px',
  top: '3px',
  width: '42px',
};
const paymentMethodBaseLargeIcon = {
  backgroundImage: `url(${paymentMethodsSpritePath})`,
  backgroundPositionX: '0px',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '100%',
  borderRadius: '8px',
  display: 'block',
  height: '48px',
  marginBottom: '10px',
  marginLeft: 'auto',
  marginRight: 'auto',
  top: '3px',
  width: '68px',
};
const paymentMethodBaseSmallIcon = {
  backgroundImage: `url(${paymentMethodsSpritePath})`,
  backgroundPositionX: '0px',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '100%',
  display: 'block',
  height: '20px',
  width: '28px',
};

const usePaymentMethodIconStyles = makeStyles()(() => ({
  americanExpress: {
    ...paymentMethodBase,
    backgroundPositionY: '-98px',
    position: 'relative',
  },

  americanExpressLargeIcon: {
    ...paymentMethodBaseLargeIcon,
    backgroundPositionY: '-150px',
    position: 'relative',
  },

  americanExpressSmallIcon: {
    ...paymentMethodBaseSmallIcon,
    backgroundPositionY: '-61px',
    position: 'relative',
  },

  debitCard: {
    ...paymentMethodBase,
    backgroundPositionY: '-130px',
    position: 'relative',
  },

  debitCardLargeIcon: {
    ...paymentMethodBaseLargeIcon,
    backgroundPositionY: '-200px',
    position: 'relative',
  },

  debitCardSmallIcon: {
    ...paymentMethodBaseSmallIcon,
    backgroundPositionY: '-81px',
    position: 'relative',
  },

  discover: {
    ...paymentMethodBase,
    backgroundPositionY: '-66px',
    position: 'relative',
  },

  discoverLargeIcon: {
    ...paymentMethodBaseLargeIcon,
    backgroundPositionY: '-100px',
    position: 'relative',
  },

  discoverSmallIcon: {
    ...paymentMethodBaseSmallIcon,
    backgroundPositionY: '-41px',
    position: 'relative',
  },

  masterCard: {
    ...paymentMethodBase,
    backgroundPositionY: '-34px',
    position: 'relative',
  },

  masterCardLargeIcon: {
    ...paymentMethodBaseLargeIcon,
    backgroundPositionY: '-50px',
    position: 'relative',
  },

  masterCardSmallIcon: {
    ...paymentMethodBaseSmallIcon,
    backgroundPositionY: '-21px',
    position: 'relative',
  },

  visa: {
    ...paymentMethodBase,
    backgroundPositionY: '-2px',
    position: 'relative',
  },

  visaLargeIcon: {
    ...paymentMethodBaseLargeIcon,
    backgroundPositionY: '-2px',
    position: 'relative',
  },

  visaSmallIcon: {
    ...paymentMethodBaseSmallIcon,
    backgroundPositionY: '-1px',
    position: 'relative',
  },
}));

export default usePaymentMethodIconStyles;
