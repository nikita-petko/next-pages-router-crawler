import { memo } from 'react';
import { useTranslation } from '@rbx/intl';
import type { TAlertProps } from '@rbx/ui';
import {
  Alert,
  AlertTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Tooltip,
  Typography,
} from '@rbx/ui';
import { TradingGiftingAckOptions } from '@modules/managed-pricing/gifting-trading/hooks';
import { docs } from '@modules/miscellaneous/urls/creatorHub';
import { Link } from '@modules/monetization-shared/link';
import useDeveloperProductRegionalPricingDisclaimerModalStyles from './DeveloperProductRegionalPricingDisclaimerModal.styles';

type Props = {
  severity?: TAlertProps['severity'];
  disabled?: boolean;
  value: string | null;
  onChange: (event: React.ChangeEvent<HTMLInputElement>, value: string) => void;
  onClickDocumentation?: () => void;
  className?: string;
};

const regionalPricingDocumentationLink = docs.getRegionalPricingMonetizationUrl();

function GiftingTradingRadioSelectionAlert({
  severity = 'info',
  disabled,
  value,
  onChange,
  onClickDocumentation,
  className,
}: Props) {
  const { translate, translateHTML } = useTranslation();
  const { classes } = useDeveloperProductRegionalPricingDisclaimerModalStyles();

  return (
    <Alert severity={severity} variant='outlined' className={className}>
      <AlertTitle className='margin-bottom-[4px]'>
        {translate('Heading.TradingGiftingAck')}
      </AlertTitle>
      <Typography variant='body2' component='p'>
        {translate('Description.TradingGiftingAck')}
      </Typography>
      <br />
      <Typography variant='body2' component='span'>
        {translateHTML('Message.SelectTradingGiftingAckWithDocumentation', [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content: (chunks) => (
              <Link
                className={classes.fontWeightLight}
                target='_blank'
                href={regionalPricingDocumentationLink}
                onClick={onClickDocumentation}>
                {chunks}
              </Link>
            ),
          },
        ])}
      </Typography>
      <RadioGroup
        className='margin-top-[8px] padding-left-[4px] small:margin-top-[4px]'
        aria-required
        aria-disabled={disabled}
        value={value}
        onChange={onChange}>
        <Tooltip
          title={disabled ? translate('Message.ReviewDocumentationToSelect') : ''}
          placement='top-start'>
          <FormControlLabel
            disabled={disabled}
            value={TradingGiftingAckOptions.NoTradingGifting}
            control={
              <Radio
                // Note: aria-label is force-required by rbx/ui, but not actually necessary
                aria-label={translate('Option.NotImplementedTradingGifting')}
                color='secondary'
                size='medium'
                className='padding-[6px]'
              />
            }
            label={translate('Option.NotImplementedTradingGifting')}
            componentsProps={{ typography: { variant: 'body2', className: 'padding-y-[4px]' } }}
          />
        </Tooltip>
        <Tooltip
          title={disabled ? translate('Message.ReviewDocumentationToSelect') : ''}
          placement='top-start'>
          <FormControlLabel
            disabled={disabled}
            value={TradingGiftingAckOptions.WithTradingGifting}
            control={
              <Radio
                // Note: aria-label is force-required by rbx/ui, but not actually necessary
                aria-label={translate('Option.ImplementedTradingGiftingWithChecks')}
                color='secondary'
                size='medium'
                className='padding-[6px]'
              />
            }
            label={translate('Option.ImplementedTradingGiftingWithChecks')}
            componentsProps={{ typography: { variant: 'body2', className: 'padding-y-[4px]' } }}
          />
        </Tooltip>
      </RadioGroup>
    </Alert>
  );
}

export default memo(GiftingTradingRadioSelectionAlert);
