import React, { FunctionComponent, useEffect } from 'react';
import billingClient from '@modules/clients/billing';
import { useTranslation } from '@rbx/intl';
import { Button, Typography } from '@rbx/ui';
import InputField from './InputField';
import CheckboxField from './CheckboxField';
import ErrorMessage from './ErrorMessage';
import useForm from '../hooks/useForm';
import useFormConfig from '../hooks/useFormConfig';
import cashOutFormFields from '../constants/formConstants';

export interface FormProps {
  onSubmitSuccess: () => void;
}

const Form: FunctionComponent<React.PropsWithChildren<FormProps>> = ({ onSubmitSuccess }) => {
  const { balance, initialValues, validationRules } = useFormConfig();

  const { translate } = useTranslation();

  const {
    values,
    errors,
    handleInputBlur,
    handleInputFocus,
    handleInputChange,
    handleNumberInputChange,
    handleSubmit,
    handleToggle,
    setValue,
    setError,
  } = useForm(initialValues, validationRules);

  useEffect(() => {
    setValue('amount', balance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance]);

  const onSubmit = async (): Promise<void> => {
    const request = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      amount: values.amount,
    };
    try {
      await billingClient.LuobuDevexAPI.v1LuobuDeveloperExchangeRequestPost({ request });
      onSubmitSuccess();
    } catch (err) {
      setError('generic', translate('Message.GenericError'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {cashOutFormFields.map(({ label, ...field }) => {
        const fieldName = field.nameKey || '';
        if (field.editor === 'textfield' || field.editor === 'numberfield') {
          return (
            <InputField
              key={field.id}
              value={values[field.id]}
              error={errors[field.id]}
              label={translate(fieldName)}
              placeholder={translate(fieldName)}
              onChange={
                field.editor === 'numberfield' ? handleNumberInputChange : handleInputChange
              }
              onBlur={handleInputBlur}
              onFocus={handleInputFocus}
              {...field}
            />
          );
        }
        if (field.editor === 'checkbox') {
          return (
            <CheckboxField
              key={field.id}
              value={values[field.id]}
              error={errors[field.id]}
              label={label}
              onChange={handleToggle}
              {...field}
            />
          );
        }
        return null;
      })}
      {errors.generic && <ErrorMessage>{errors.generic}</ErrorMessage>}
      <Button type='submit' variant='contained' color='primaryBrand' fullWidth>
        <Typography color='info'>{translate('Action.CashOut')}</Typography>
      </Button>
    </form>
  );
};

export default Form;
