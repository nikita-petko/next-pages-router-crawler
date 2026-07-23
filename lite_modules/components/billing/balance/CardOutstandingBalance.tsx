import { Button, Icon, ProgressBar } from '@rbx/foundation-ui';
import { Tooltip } from '@rbx/ui';
import { useRouter } from 'next/router';

import { PaymentMethodActionEnum } from '@constants/billing';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { NumberToCommaSeparatedWithDecimalString } from '@utils/currency';

interface CardOutstandingBalanceProps {
  balance: number;
  hasFailedPayment: boolean;
  paymentThreshold: number;
  showReplaceCardButton?: boolean;
}

interface LinearProgressWithValueProps {
  value: number;
}

const ErrorLinearProgress = ({ value }: LinearProgressWithValueProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  return (
    <ProgressBar
      ariaLabel={translate('Heading.OutstandingBalance')}
      className='grow-1 shrink-1 min-width-0'
      data-testid='errorProgressBar'
      value={value}
      variant='Determinate'
    />
  );
};

const SuccessLinearProgress = ({ value }: LinearProgressWithValueProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  return (
    <ProgressBar
      ariaLabel={translate('Heading.OutstandingBalance')}
      className='grow-1 shrink-1 min-width-0'
      data-testid='progressBar'
      value={value}
      variant='Determinate'
    />
  );
};

const CardOutstandingBalance = ({
  balance,
  hasFailedPayment,
  paymentThreshold,
  showReplaceCardButton = true,
}: CardOutstandingBalanceProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);

  const router = useRouter();
  const handleClick = () => {
    router.push({
      pathname: Routes.ADD_PAYMENT,
      query: { action: PaymentMethodActionEnum.UPDATE_CARD },
    });
  };

  const balanceAmountValue = translate('Label.AmountUSD', {
    amount: balance < 0 ? `-${(-balance).toFixed(2)}` : balance.toFixed(2),
  });

  const paymentThresholdLabel = translate('Label.AmountUSD', {
    amount: NumberToCommaSeparatedWithDecimalString(paymentThreshold),
  });

  const progressBarValue = Math.min((balance / paymentThreshold) * 100, 100);

  return (
    <div
      className='flex grow-1 shrink-1 min-width-0 flex-col gap-xxlarge self-stretch'
      data-testid='balanceContainer'>
      <div className='flex width-full items-start gap-xxlarge'>
        <div className='flex grow-1 shrink-1 min-width-0 flex-col gap-small'>
          <div className='flex flex-col gap-small'>
            <span className='text-title-large content-default' data-testid='currentBalanceHeader'>
              {translate('Heading.OutstandingBalance')}
            </span>
            <span className='text-heading-large content-emphasis' data-testid='balanceAmount'>
              {balanceAmountValue}
            </span>
          </div>
          <div className='flex width-full items-center gap-small'>
            {hasFailedPayment ? (
              <ErrorLinearProgress value={progressBarValue} />
            ) : (
              <SuccessLinearProgress value={progressBarValue} />
            )}
            <span
              className='content-emphasis shrink-0 text-label-medium'
              data-testid='progressBarLabel'>
              {paymentThresholdLabel}
            </span>
          </div>
          <div className='flex items-center gap-small' data-testid='balanceChargeReminder'>
            <span
              className='text-body-medium content-default'
              data-testid='balanceChargeReminderText'>
              {translate('Description.BalanceChargeReminder', {
                amount: paymentThreshold.toString(),
              })}
            </span>
            <Tooltip
              arrow
              data-testid='balanceChargeReminderTooltip'
              placement='bottom'
              title={translate('Description.BalanceChargeReminderTooltip')}>
              <Icon className='content-default' name='icon-regular-circle-i' size='Small' />
            </Tooltip>
          </div>
        </div>
        {showReplaceCardButton ? (
          <Button
            className='shrink-0'
            data-testid='replaceCardButton'
            onClick={handleClick}
            size='Medium'
            variant='Standard'>
            {translate('Action.ReplaceCard')}
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default CardOutstandingBalance;
