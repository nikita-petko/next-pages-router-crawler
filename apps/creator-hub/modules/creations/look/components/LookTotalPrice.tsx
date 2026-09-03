import type { FunctionComponent } from 'react';
import { Icon } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export interface LookTotalPriceProps {
  totalValue: number;
}

const LookTotalPrice: FunctionComponent<LookTotalPriceProps> = ({ totalValue }) => {
  const { translate } = useTranslation();
  return (
    <div>
      <div className='text-heading-medium'>{translate('Label.Pricing')}</div>
      <div
        className='grid items-center gap-y-[16px] margin-top-[32px] large:[grid-template-columns:5fr_7fr]'
        data-testid='look-total-price-section'>
        <div className='flex flex-col items-start [min-width:0] padding-right-[20px]'>
          <div className='text-label-large'>{translate('Label.TotalPrice')}</div>
          <div className='text-body-medium content-muted margin-top-[8px]'>
            {translate('Message.TotalPriceDescription')}
          </div>
        </div>
        <div className='flex items-center gap-xsmall shrink-0'>
          <Icon name='icon-filled-robux' size='Large' />
          <div className='text-label-large' data-testid='look-total-price-robux'>
            {totalValue}
          </div>
        </div>
      </div>
    </div>
  );
};

export default withTranslation(LookTotalPrice, [TranslationNamespace.ConfigureItem]);
