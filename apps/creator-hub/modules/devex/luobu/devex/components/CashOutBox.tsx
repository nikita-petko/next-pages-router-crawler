import React, { FunctionComponent } from 'react';
import { useRouter } from 'next/router';
import { LuobuDevexEligibilityEnum as Eligibility } from '@modules/clients/billing';
import { useTranslation } from '@rbx/intl';
import { Button, Grid, Typography } from '@rbx/ui';
import useCashOutBoxStyles from './CashOutBox.styles';

interface CashOutBoxProps {
  balance: number;
  eligibility: Eligibility;
}

const CashOutBox: FunctionComponent<React.PropsWithChildren<CashOutBoxProps>> = ({
  balance,
  eligibility,
}) => {
  const router = useRouter();
  const {
    classes: { root, amount },
  } = useCashOutBoxStyles();

  const { translate } = useTranslation();

  const ELIGIBILITY_MESSAGE: Record<Eligibility, string> = {
    [Eligibility.Eligible]: translate('Message.CashOutEligible'),
    [Eligibility.InsufficientBalance]: translate('Message.CashOutInsufficientBalance'),
    [Eligibility.RecentRequest]: translate('Message.CashOutRecentRequest'),
    [Eligibility.InsufficientAge]: translate('Message.CashOutInsufficientAge'),
    [Eligibility.Unknown]: translate('Message.CashOutIneligible'),
  };

  return (
    <Grid className={root} container spacing={1} justifyContent='space-between'>
      <Grid item>
        <Typography className={amount} variant='h3' color='primary'>
          {/* FIXME: Hard coded currency symbol */}
          {`¥ ${balance}`}
        </Typography>
        <Typography color='primary'>{ELIGIBILITY_MESSAGE[eligibility]}</Typography>
      </Grid>
      <Grid item XSmall={12} Medium='auto'>
        <Button
          onClick={() => router.push('/dashboard/devex/cashout')}
          fullWidth
          variant='contained'
          color='primaryBrand'
          disabled={eligibility !== 'Eligible'}>
          <Typography color='primary'>{translate('Action.CashOut')}</Typography>
        </Button>
      </Grid>
    </Grid>
  );
};

export default CashOutBox;
