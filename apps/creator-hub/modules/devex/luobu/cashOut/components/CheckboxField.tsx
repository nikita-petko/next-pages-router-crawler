import React, { ChangeEvent, FunctionComponent, ReactNode } from 'react';
import { Checkbox, FormControlLabel } from '@rbx/ui';
import ErrorMessage from './ErrorMessage';

import useCheckboxFieldStyles from './CheckboxField.styles';

export interface FieldProps {
  id: string;
  label?: ReactNode;
  value?: unknown;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

const Field: FunctionComponent<React.PropsWithChildren<FieldProps>> = ({
  id,
  label,
  value,
  onChange,
  error,
}) => {
  const {
    classes: { margin, termsCheckbox },
  } = useCheckboxFieldStyles();

  return (
    <div className={margin}>
      <FormControlLabel
        control={
          <Checkbox
            className={termsCheckbox}
            id={id}
            name={id}
            checked={!!value}
            onChange={onChange}
          />
        }
        label={label}
      />
      <ErrorMessage>{error}</ErrorMessage>
    </div>
  );
};

export default Field;
