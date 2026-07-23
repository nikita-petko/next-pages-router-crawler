import React, { FunctionComponent } from 'react';
import { Grid, Typography, CircularProgress } from '@rbx/ui';
import { NumberFormatter } from '@rbx/core';
import { Locale, useLocalization } from '@rbx/intl';
import useQuotaStyles from './Quota.styles';

export interface QuotaProps {
  quota: number;
  balance: number;
  description: string;
}

const isUnderOnePercentQuotaUsed = (usedQuota: number, totalQuota: number) => {
  return usedQuota / totalQuota < 0.01;
};

const getPercentageWithOneDecimal = (usedQuota: number, totalQuota: number) => {
  return totalQuota === 0 ? 0 : Math.round((usedQuota / totalQuota) * 1000) / 10;
};

const getPercentageInInteger = (usedQuota: number, totalQuota: number) => {
  return totalQuota === 0 ? 0 : Math.floor((usedQuota / totalQuota) * 100);
};

const Quota: FunctionComponent<React.PropsWithChildren<QuotaProps>> = ({
  quota,
  balance,
  description,
}) => {
  const {
    classes: { gridContainer, bodyText, quotaType, ratioText, loader, percent },
  } = useQuotaStyles();
  const { locale } = useLocalization();
  const numberFormatter = new NumberFormatter(locale ?? Locale.English, '');
  const usedQuota = quota - balance;
  let percentage = 0;
  if (isUnderOnePercentQuotaUsed(usedQuota, quota)) {
    percentage = getPercentageWithOneDecimal(usedQuota, quota);
  } else {
    percentage = getPercentageInInteger(usedQuota, quota);
  }
  const option = { notation: 'compact' };
  const ratio = `${numberFormatter.getCustomNumber(
    usedQuota,
    option as Intl.NumberFormatOptions,
  )}/${numberFormatter.getCustomNumber(quota, option as Intl.NumberFormatOptions)}`;

  return (
    <Grid container item>
      <Grid container className={gridContainer} alignItems='center'>
        <CircularProgress className={loader} value={100} color='primary' variant='determinate' />
        <Typography variant='footer' className={percent}>
          {`${percentage}%`}
        </Typography>
        <Grid direction='column' className={bodyText}>
          <Grid className={ratioText}>
            <Typography variant='largeLabel1'>{ratio}</Typography>
          </Grid>
          <Grid>
            <Typography className={quotaType} variant='largeLabel2'>
              {description}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Quota;
