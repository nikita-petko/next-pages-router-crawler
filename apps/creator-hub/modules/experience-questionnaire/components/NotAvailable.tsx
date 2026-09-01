import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, useMediaQuery } from '@rbx/ui';
import useNotEligibleStyles from './NotEligible.styles';

const NotAvailable: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();

  const isCompact = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const {
    classes: { root, background, loggedinErrorArea, textHeader },
  } = useNotEligibleStyles();

  return (
    <Grid className={root} alignItems='center' justifyContent='center' container>
      <Grid container item className={background} justifyContent='center' alignItems='flex-start'>
        <Grid item className={loggedinErrorArea} Medium={6}>
          <Typography
            color='primary'
            variant='h1'
            className={textHeader}
            align={isCompact ? 'center' : 'left'}>
            {translate('Heading.NotAvailable')}
          </Typography>
          <Typography color='secondary' component='p' align={isCompact ? 'center' : 'left'}>
            {translate('Description.NotAvailable')}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default NotAvailable;
