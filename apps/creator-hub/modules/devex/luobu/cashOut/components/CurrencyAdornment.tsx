import React, { FunctionComponent } from 'react';
import { InputAdornment, Typography } from '@rbx/ui';

import useCurrencyAdornmentStyles from './CurrencyAdornment.styles';

const CurrencyAdornment: FunctionComponent<React.PropsWithChildren<unknown>> = ({ children }) => {
  const {
    classes: { inputAdornment, currency },
  } = useCurrencyAdornmentStyles();
  return (
    <InputAdornment className={inputAdornment} position='start'>
      <Typography className={currency} component='p' variant='h3' color='secondary'>
        {children}
      </Typography>
    </InputAdornment>
  );
};

export default CurrencyAdornment;
