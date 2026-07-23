import type { FunctionComponent } from 'react';
import React, { Fragment, useMemo } from 'react';
import { Locale, useLocalization } from '@rbx/intl';
import { DescriptionOutlinedIcon, Grid, Typography } from '@rbx/ui';
import { ActivityType } from '../../types';
import useAccountActivityInRowDateStyles from './AccountActivityInRowDate.styles';

type TAccountActivityInRowDateProps = { date: Date; type: ActivityType };

const AccountActivityInRowDate: FunctionComponent<TAccountActivityInRowDateProps> = ({
  date,
  type,
}) => {
  const { locale } = useLocalization();
  const {
    classes: { descriptionIcon },
  } = useAccountActivityInRowDateStyles();
  const formatPaymentDate = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale ?? Locale.English, {
      dateStyle: 'medium',
    });
    return formatter.format;
  }, [locale]);

  const billDateFormatter = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale ?? Locale.English, {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
    return formatter.format;
  }, [locale]);

  if (type === ActivityType.Bill) {
    return (
      <Grid item container alignItems='center'>
        <DescriptionOutlinedIcon fontSize='large' className={descriptionIcon} />
        <Typography variant='smallLabel1'>{billDateFormatter(date)}</Typography>
      </Grid>
    );
  }
  return <>{formatPaymentDate(date)}</>;
};

export default React.memo(AccountActivityInRowDate);
