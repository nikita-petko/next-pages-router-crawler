import type { FunctionComponent } from 'react';
import React, { useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Alert, Button, CloseIcon, IconButton, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { DEVEX_HELP_URL } from '../../constants/externalLinkConstants';
import { PAYOUT_INFO_ICON_URL } from '../assets/payoutInfoIconUrl';
import useCashOutPayoutInfoBannerStyles from './CashOutPayoutInfoBanner.styles';

type CashOutPayoutInfoBannerProps = {
  className?: string;
  /** Locale-formatted freshness date (from the watermark `lastProcessedTimestamp`) for the `{lastUpdated}` token. */
  lastUpdated: string;
};

const CashOutPayoutInfoBanner: FunctionComponent<CashOutPayoutInfoBannerProps> = ({
  className,
  lastUpdated,
}) => {
  const [visible, setVisible] = useState(true);
  const { translate } = useTranslation();
  const {
    classes: { root, actionRow, closeButton, learnMoreButton },
  } = useCashOutPayoutInfoBannerStyles();

  if (!visible) {
    return null;
  }

  const alertClassName = [root, className].filter(Boolean).join(' ');

  return (
    <Alert
      severity='info'
      variant='outlined'
      data-testid='devex-cashout-payout-info-banner'
      className={alertClassName}
      icon={<img src={PAYOUT_INFO_ICON_URL} alt='' width={24} height={24} />}
      action={
        <div className={actionRow}>
          <Button
            size='small'
            variant='contained'
            color='secondary'
            component='a'
            href={DEVEX_HELP_URL}
            target='_blank'
            rel='noopener noreferrer'
            className={`text-label-small ${learnMoreButton}`}>
            {translate('Action.LearnMore' /* TranslationNamespace.DevEx */)}
          </Button>
          <IconButton
            aria-label={translate('Action.Close' /* TranslationNamespace.DevEx */)}
            color='inherit'
            size='small'
            className={closeButton}
            onClick={() => setVisible(false)}>
            <CloseIcon fontSize='large' />
          </IconButton>
        </div>
      }>
      <Typography component='div' className='text-body-medium'>
        {translate('Message.CashOutPayoutRateInfoBanner' /* TranslationNamespace.DevEx */, {
          lastUpdated,
        })}
      </Typography>
    </Alert>
  );
};

export default withTranslation(CashOutPayoutInfoBanner, [TranslationNamespace.DevEx]);
