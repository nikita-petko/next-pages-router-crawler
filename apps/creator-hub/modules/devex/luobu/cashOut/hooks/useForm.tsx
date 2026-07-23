import { ChangeEvent, FocusEvent, FormEvent, useState } from 'react';

export type Value = any;

export interface Values {
  [key: string]: Value;
}

export interface Errors {
  [key: string]: string;
}

export interface ValidationRules {
  [key: string]: ((value: unknown) => string)[];
}

const useForm = (initialValues: Values, validationRules: ValidationRules = {}) => {
  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<Errors>({});

  const setValue = (fieldName: string, value: unknown) => {
    setValues({ ...values, [fieldName]: value });
  };

  const setError = (fieldName: string, error: string) => {
    setErrors({ ...errors, [fieldName]: error });
  };

  const validateField = (fieldName: string, value: unknown): string => {
    let error = '';
    if (validationRules[fieldName]) {
      validationRules[fieldName].every((rule) => {
        error = rule(value);
        return error === '';
      });
    }
    return error;
  };

  const handleInputBlur = (e: FocusEvent<HTMLInputElement>) => {
    const error = validateField(e.target.name, e.target.value);
    if (error) {
      setError(e.target.name, error);
    }
  };

  const handleInputFocus = (e: FocusEvent<HTMLInputElement>) => {
    setError(e.target.name, '');
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.name, e.target.value);
  };

  const handleNumberInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (value === '') {
      setValue(e.target.name, 0);
    } else if (/^\d+$/.test(value)) {
      const numberValue = parseInt(value, 10);
      if (!Number.isNaN(numberValue)) setValue(e.target.name, numberValue);
    }
  };

  const handleToggle = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.name, !values[e.target.name]);
    const error = validateField(e.target.name, !values[e.target.name]);
    if (error) {
      setError(e.target.name, error);
    } else {
      setError(e.target.name, '');
    }
  };

  const hasErrors = (errorObj: Errors): boolean => Object.keys(errorObj).length === 0;

  const validateForm = (): boolean => {
    const newErrors = Object.keys(validationRules).reduce<Errors>((errorObj, fieldName) => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        return { ...errorObj, [fieldName]: error };
      }
      return errorObj;
    }, {});
    setErrors(newErrors);
    return hasErrors(newErrors);
  };

  const handleSubmit =
    (onSubmit: () => Promise<void>) =>
    async (e: FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();
      if (validateForm()) {
        await onSubmit();
      }
    };

  return {
    handleInputBlur,
    handleInputFocus,
    handleInputChange,
    handleNumberInputChange,
    handleToggle,
    handleSubmit,
    setValue,
    setError,
    values,
    errors,
  };
};

export default useForm;
