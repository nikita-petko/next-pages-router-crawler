import React, { ChangeEvent, FocusEvent, FunctionComponent, ReactNode } from 'react';
import { Input, InputLabel, Typography } from '@rbx/ui';
import ErrorMessage from './ErrorMessage';
import useInputFieldStyles from './InputField.styles';

type InputType = 'text' | 'email' | 'number' | 'password' | 'submit';

export interface FieldProps {
  id: string;
  type?: InputType;
  placeholder?: string;
  label?: string;
  value?: unknown;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  startAdornment?: ReactNode;
}

const Field: FunctionComponent<React.PropsWithChildren<FieldProps>> = ({
  id,
  type,
  placeholder,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  startAdornment,
}) => {
  const {
    classes: { margin },
  } = useInputFieldStyles();

  return (
    <div className={margin}>
      <InputLabel className={margin} htmlFor={id}>
        <Typography color='info'>{label}</Typography>
      </InputLabel>
      <Input
        id={id}
        type={type}
        name={id}
        placeholder={placeholder}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        value={value}
        error={!!error}
        autoComplete='off'
        startAdornment={startAdornment}
        fullWidth
      />
      <ErrorMessage>{error}</ErrorMessage>
    </div>
  );
};

export default Field;
