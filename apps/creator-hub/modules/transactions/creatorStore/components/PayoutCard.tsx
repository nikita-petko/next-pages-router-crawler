import type { FunctionComponent } from 'react';
import React from 'react';
import type {
  AepTypeMoney as Money,
  RobloxPaymentsSharedV1PayoutStatus as PayoutStatusTypes,
} from '@rbx/client-marketplace-fiat-service/v1';
import { useLocalization } from '@rbx/intl';
import { Card, Grid, Typography } from '@rbx/ui';
import { getPriceDisplayStringFromMoney } from '@modules/marketplaceFiatService/utils/fiatUtils';
import usePayoutCardStyles from './PayoutCard.styles';
import PayoutStatus from './payouts/PayoutStatus';

export type PayoutCardProps = {
  amount: Money;
  description: string;
  header: string;
  status?: PayoutStatusTypes;
};

const PayoutCard: FunctionComponent<React.PropsWithChildren<PayoutCardProps>> = ({
  amount,
  description,
  header,
  status,
}) => {
  const { classes: styles } = usePayoutCardStyles();
  const { locale } = useLocalization();

  return (
    <Card className={styles.cardContainer}>
      <Grid container direction='column' padding={2}>
        <Grid item>
          <Typography variant='h5'>{header}</Typography>
        </Grid>
        <Grid item className={styles.subheader}>
          <Typography color='secondary' variant='body2'>
            {description}
          </Typography>
        </Grid>
        <Grid item>
          <Grid container alignItems='center' direction='row' spacing={1}>
            <Grid item>
              <Typography variant='h2'>{getPriceDisplayStringFromMoney(amount, locale)}</Typography>
            </Grid>
            <Grid item>{status && <PayoutStatus status={status} />}</Grid>
          </Grid>
        </Grid>
      </Grid>
    </Card>
  );
};

export default PayoutCard;
