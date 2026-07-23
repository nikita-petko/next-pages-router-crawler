import type { FC } from 'react';
import React from 'react';
import useInputFieldWrapperStyles from './InputFieldWrapper.styles';

type InputFieldWrapperProps = {
  id?: string;
  'data-testid'?: string;
  className?: string;
  label?: React.ReactNode;
  variant?: 'outlined';
  error?: boolean;
  helperText?: string;
};

// Helper component to wrap content in the same style as the Input component
const InputFieldWrapper: FC<React.PropsWithChildren<InputFieldWrapperProps>> = ({
  children,
  id,
  'data-testid': dataTestId,
  className,
  label,
  variant = 'outlined',
  error = false,
  helperText,
}) => {
  if (variant !== 'outlined') {
    throw new Error('Only outlined variant is supported');
  }
  const {
    classes: {
      fieldSetContainer,
      content,
      inputContainer,
      label: labelClass,
      legend,
      helperText: helperTextClass,
    },
  } = useInputFieldWrapperStyles({ error });
  return (
    <div className={className} id={id} data-testid={dataTestId}>
      <div className={inputContainer}>
        <span className={labelClass}>{label}</span>
        <div className={content}>{children}</div>
        {/* Fieldset providing the border and hiding the border behind the label */}
        <fieldset className={fieldSetContainer}>
          {/* Fake legend to hide border behind label */}
          <legend className={legend}>
            <span>{label}</span>
          </legend>
        </fieldset>
      </div>
      <p className={helperTextClass}>{helperText}</p>
    </div>
  );
};

export default InputFieldWrapper;
