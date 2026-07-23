import { ReactNode } from 'react';

import { adCreditSpritePath } from '@constants/billing';

const billingSectionCardClassName =
  'flex width-full flex-col items-start gap-xxlarge medium:flex-row radius-medium bg-shift-100 padding-xxlarge';

export const RobloxAdCreditChip = () => (
  <div className='flex height-[77px] width-[110px] shrink-0 items-center justify-center radius-small bg-[#121215]'>
    <img alt='' className='size-[48px]' src={adCreditSpritePath} />
  </div>
);

interface BillingPaymentMethodSectionProps {
  children: ReactNode;
}

const BillingPaymentMethodSection = ({ children }: BillingPaymentMethodSectionProps) => (
  <div className={billingSectionCardClassName} data-testid='paymentMethodsContainer'>
    {children}
  </div>
);

export default BillingPaymentMethodSection;
