import React, { FunctionComponent } from 'react';
import { Alert, Typography } from '@rbx/ui';
import useErrorMessageStyles from './ErrorMessage.styles';

export interface ErrorMessageProps {
  errors: string[];
  className?: string;
  alert?: boolean;
}

export const ErrorMessage: FunctionComponent<React.PropsWithChildren<ErrorMessageProps>> = ({
  errors,
  className,
  alert = false,
}) => {
  const {
    classes: { errorStyle, errorAlertStyle },

    cx,
  } = useErrorMessageStyles();
  return (
    <div className={cx(errorStyle, className)}>
      {errors.map((error) =>
        !alert ? (
          <Typography key={error.toString()} variant='body2' color='error'>
            {error}
          </Typography>
        ) : (
          <Alert key={error.toString()} severity='error' className={errorAlertStyle}>
            {error}
          </Alert>
        ),
      )}
    </div>
  );
};

export default ErrorMessage;
