import React, { FunctionComponent } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import { Button, Grid, Typography } from '@rbx/ui';
import Form from './Form';

import useCashOutFormStyles from './CashOutForm.styles';

export interface CashOutFormProps {
  onSubmitSuccess: () => void;
}

const CashOutForm: FunctionComponent<React.PropsWithChildren<CashOutFormProps>> = ({
  onSubmitSuccess,
}) => {
  const router = useRouter();
  const {
    classes: { root, header },
  } = useCashOutFormStyles();
  const { translate } = useTranslation();

  return (
    <Grid className={root} container direction='column' spacing={2}>
      <Grid item>
        <Typography className={header} variant='h2' component='h1'>
          {translate('Heading.DevEx')}
        </Typography>
        <Typography variant='h3' component='h2' color='secondary'>
          {translate('Label.Slogan')}
        </Typography>
      </Grid>
      <Grid item>
        <Typography color='secondary' component='p'>
          {translate('Description.FormInstruction')}
        </Typography>
      </Grid>
      <Grid item>
        <Form onSubmitSuccess={onSubmitSuccess} />
      </Grid>
      <Grid item>
        <Button onClick={() => router.push('/dashboard/devex')} variant='outlined' fullWidth>
          {translate('Action.Cancel')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default CashOutForm;
