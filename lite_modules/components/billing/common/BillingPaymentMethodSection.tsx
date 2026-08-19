import { ReactNode } from 'react';

import { adCreditSpritePath } from '@constants/billing';

const billingSectionCardClassName =
  'flex width-full flex-col items-start gap-xxlarge medium:flex-row radius-medium bg-shift-100 padding-xxlarge';

// Fixed to the dark-mode surface in both themes because the Roblox sprite it
// frames is a solid white glyph. Its sibling tile in CreditCardSummary is pinned
// to the light surface for the same reason inverted: that sprite is a
// multi-colour card-brand sheet drawn with dark glyphs.
export const RobloxAdCreditChip = () => (
  <div className='flex height-[77px] width-[110px] shrink-0 items-center justify-center radius-small bg-[var(--dark-mode-surface-0)]'>
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
