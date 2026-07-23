import type { UseFormProps } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { FormMode } from '@modules/miscellaneous/common';
import type { InputFormData } from '../types';
import { defaultContactInfo, defaultAccountInfo } from '../types';

const useFormMethods = (props?: UseFormProps<InputFormData>) => {
  return useForm<InputFormData>({
    mode: FormMode.OnSubmit,
    reValidateMode: FormMode.OnChange,
    shouldUnregister: true,
    defaultValues: {
      contactInfo: defaultContactInfo,
      accountInfo: defaultAccountInfo,
    },
    ...props,
  });
};

export default useFormMethods;
