import React, { FunctionComponent } from 'react';
import { Typography } from '@rbx/ui';

import useErrorStyles from './Error.styles';

export const ErrorMessage: FunctionComponent<React.PropsWithChildren<unknown>> = ({ children }) => {
  const {
    classes: { errorStyle },
  } = useErrorStyles();
  return (
    <Typography className={errorStyle} component='div' color='error'>
      {children}
    </Typography>
  );
};

export default ErrorMessage;
