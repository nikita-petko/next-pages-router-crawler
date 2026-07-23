import { memo } from 'react';

import usePaymentMethodIconStyles from '@components/common/PaymentMethodIcon.styles';
import { PaymentMethodType } from '@constants/billing';

interface PaymentMethodIconProps {
  largeIcon: boolean;
  paymentMethodType: string | null;
  smallIcon?: boolean | null;
}

const PaymentMethodIcon = memo(
  ({ largeIcon = false, paymentMethodType, smallIcon = false }: PaymentMethodIconProps) => {
    const {
      classes: {
        americanExpress,
        americanExpressLargeIcon,
        americanExpressSmallIcon,
        debitCard,
        debitCardLargeIcon,
        debitCardSmallIcon,
        discover,
        discoverLargeIcon,
        discoverSmallIcon,
        masterCard,
        masterCardLargeIcon,
        masterCardSmallIcon,
        visa,
        visaLargeIcon,
        visaSmallIcon,
      },
    } = usePaymentMethodIconStyles();
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
    return <span className={paymentMethodStyle} />;
  },
);

export default PaymentMethodIcon;
