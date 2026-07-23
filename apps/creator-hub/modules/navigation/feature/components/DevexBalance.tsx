import React, { FunctionComponent, useEffect, useState } from 'react';
import billingClient from '@modules/clients/billing';
import { getAbbreviatedNumber } from '@rbx/core';
import { Grid, Typography } from '@rbx/ui';
import useDevexBalanceStyles from './DevexBalance.styles';

const DevexBalance: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const {
    classes: { root },
  } = useDevexBalanceStyles();

  const [balance, setBalance] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const balanceResponse =
        await billingClient.LuobuDevexAPI.v1LuobuDeveloperExchangeBalanceGet();
      if (balanceResponse.amount) {
        const amount = Math.floor(balanceResponse.amount);
        setBalance(getAbbreviatedNumber(amount));
      }
    };

    fetchData();
  }, []);

  return balance ? (
    <Grid className={root}>
      <Typography variant='body1' color='secondary'>
        {/* FIXME: Hard coded currency symbol */}
        {`¥ ${balance}`}
      </Typography>
    </Grid>
  ) : null;
};

export default DevexBalance;
