import React, { FunctionComponent } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import { Button, Grid, Typography, useMediaQuery } from '@rbx/ui';

import useRequestConfirmationStyles from './RequestConfirmation.styles';

const RequestConfirmation: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const router = useRouter();
  const {
    classes: { root },
  } = useRequestConfirmationStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const { translate } = useTranslation();

  return (
    <Grid
      className={root}
      container
      direction='column'
      alignItems={isCompactView ? 'stretch' : 'center'}
      justifyContent='center'
      spacing={2}>
      <Grid item>
        <Typography variant='h3' align={isCompactView ? 'left' : 'center'}>
          {translate('Heading.RequestSubmitted')}
        </Typography>
      </Grid>
      <Grid item>
        <Typography color='secondary' align={isCompactView ? 'left' : 'center'}>
          {translate('Message.RequestSubmitted')}
        </Typography>
      </Grid>
      <Grid item>
        <Button
          onClick={() => router.push('/dashboard/devex')}
          color='inherit'
          variant='outlined'
          fullWidth>
          {translate('Action.OK')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default RequestConfirmation;
