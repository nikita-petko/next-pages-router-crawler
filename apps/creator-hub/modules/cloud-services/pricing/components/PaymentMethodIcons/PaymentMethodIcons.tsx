import type { FunctionComponent } from 'react';
import React from 'react';
import usePaymentMethodIconsStyles from './PaymentMethodIcons.styles';

export enum PaymentMethodType {
  Visa = 'visa',
  MasterCard = 'mastercard',
  AmericanExpress = 'amex',
  Discover = 'discover',
  Default = 'default',
}

export interface PaymentMethodProp {
  paymentMethodType: string | null;
  largeIcon: boolean;
  smallIcon: boolean | null;
}

const PaymentMethodIcons: FunctionComponent<PaymentMethodProp> = ({
  paymentMethodType,
  largeIcon,
  smallIcon,
}) => {
  const {
    classes: {
      visa,
      visaSmallIcon,
      visaLargeIcon,
      masterCard,
      masterCardSmallIcon,
      masterCardLargeIcon,
      discover,
      discoverSmallIcon,
      discoverLargeIcon,
      americanExpress,
      americanExpressSmallIcon,
      americanExpressLargeIcon,
      debitCard,
      debitCardSmallIcon,
      debitCardLargeIcon,
    },
  } = usePaymentMethodIconsStyles();
  const paymentMethodStyle = (() => {
    switch (paymentMethodType) {
      case PaymentMethodType.Visa:
        if (smallIcon) {
          return visaSmallIcon;
        }
        return largeIcon ? visaLargeIcon : visa;
      case PaymentMethodType.MasterCard:
        if (smallIcon) {
          return masterCardSmallIcon;
        }
        return largeIcon ? masterCardLargeIcon : masterCard;
      case PaymentMethodType.Discover:
        if (smallIcon) {
          return discoverSmallIcon;
        }
        return largeIcon ? discoverLargeIcon : discover;
      case PaymentMethodType.AmericanExpress:
        if (smallIcon) {
          return americanExpressSmallIcon;
        }
        return largeIcon ? americanExpressLargeIcon : americanExpress;
      default:
        if (smallIcon) {
          return debitCardSmallIcon;
        }
        return largeIcon ? debitCardLargeIcon : debitCard;
    }
  })();
  return <span className={`${paymentMethodStyle}`} />;
};

export default PaymentMethodIcons;
