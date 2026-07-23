import type { FunctionComponent } from 'react';
import React from 'react';
import { InputLabel, Typography } from '@rbx/ui';
import useFormLabelStyles from './FormLabel.styles';

export interface FormLabelProps {
  isRequired?: boolean;
  htmlFor?: string;
  labelName: string;
  requiredText?: string;
  className?: string;
}

const FormLabel: FunctionComponent<React.PropsWithChildren<FormLabelProps>> = ({
  className,
  isRequired,
  htmlFor,
  labelName,
  requiredText,
}) => {
  const {
    classes: { requiredLabel },
  } = useFormLabelStyles();

  return (
    <InputLabel htmlFor={htmlFor} className={className}>
      <Typography component='span' variant='h6' color='primary'>
        {labelName}
      </Typography>
      {isRequired && (
        <Typography className={requiredLabel} component='span' color='error'>
          <i>{requiredText ? `(${requiredText})` : '*'}</i>
        </Typography>
      )}
    </InputLabel>
  );
};
export default FormLabel;
