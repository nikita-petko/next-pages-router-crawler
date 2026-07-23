import type { FunctionComponent } from 'react';
import React, { useState } from 'react';
import { InputLabel, TextField, Typography, Grid } from '@rbx/ui';
import useFormInputStyles from './FormInput.styles';

export interface FormInputProps {
  htmlForAttr?: string;
  inputLabelName?: string;
  emptyInputValueErrorMessage?: string;
  placeholder?: string;
  initialInputValue?: string;
  maxInputLength?: number;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  onChange?: (val: string) => void;
  setIsValid?: (valid: boolean) => void;
}

const FormInput: FunctionComponent<React.PropsWithChildren<FormInputProps>> = ({
  htmlForAttr,
  inputLabelName,
  emptyInputValueErrorMessage,
  placeholder,
  initialInputValue,
  maxInputLength,
  rows = 1,
  disabled = false,
  required = false,
  onChange,
  setIsValid,
}) => {
  const [inputValue, setInputValue] = useState<string | undefined>(initialInputValue);
  const {
    classes: { inputLabel, limitLabel, limitLabelError },
  } = useFormInputStyles();

  const onInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const val = e.target.value;
    if (maxInputLength && val.length <= maxInputLength) {
      setInputValue(val);
      if (onChange) {
        onChange(val);
      }

      if (setIsValid) {
        setIsValid(true);
      }
    }
    if (required && val.length === 0) {
      if (setIsValid) {
        setIsValid(false);
      }
    }
  };

  let bottomInputLabel;

  // show maxInput fractional chaaracter counter if a max character limit is provided
  if (maxInputLength) {
    bottomInputLabel = (
      <InputLabel className={limitLabel} htmlFor={htmlForAttr}>
        <Typography color='secondary' variant='body2'>
          {`${inputValue?.length ?? 0}/${maxInputLength}`}
        </Typography>
      </InputLabel>
    );
  }

  // zero character value errors should override the fractional character counter
  if (required && inputValue?.length === 0) {
    bottomInputLabel = (
      <InputLabel className={limitLabelError} htmlFor={htmlForAttr}>
        <Typography variant='smallLabel1'>{emptyInputValueErrorMessage}</Typography>
      </InputLabel>
    );
  }

  return (
    <Grid item>
      {inputLabelName && (
        <InputLabel className={inputLabel} htmlFor={htmlForAttr}>
          <Typography variant='h6'>{inputLabelName}</Typography>
        </InputLabel>
      )}

      <TextField
        disabled={disabled}
        multiline={!!(rows && rows > 1)}
        placeholder={placeholder}
        rows={rows}
        error={required && inputValue?.length === 0}
        value={inputValue || ''}
        onChange={onInputChange}
        label=''
        id={htmlForAttr || ''}
        fullWidth
      />

      {bottomInputLabel}
    </Grid>
  );
};

export default FormInput;
