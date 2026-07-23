import React, { PropsWithChildren, FunctionComponent, useState, useMemo } from 'react';
import { useForm, FormProvider, UseFormProps } from 'react-hook-form';
import { FormMode } from '@modules/miscellaneous/common';
import { ErrorStates, VirtualBenefitFormType } from './types';
import VirtualBenefitContext from './VirtualBenefitContext';

export type VirtualBenefitFormProviderProps = UseFormProps<VirtualBenefitFormType>;

const VirtualBenefitFormProvider: FunctionComponent<
  PropsWithChildren<VirtualBenefitFormProviderProps>
> = ({ children, ...props }) => {
  const [errorState, setErrorState] = useState<ErrorStates | null>(null);
  const [isLoadingAsset, setIsLoadingAsset] = useState<boolean>(false);
  const contextValue = useMemo(
    () => ({ errorState, setErrorState, isLoadingAsset, setIsLoadingAsset }),
    [errorState, isLoadingAsset],
  );

  const methods = useForm<VirtualBenefitFormType>({
    mode: FormMode.OnSubmit,
    reValidateMode: FormMode.OnChange,
    shouldUnregister: false,
    ...props,
  });

  return (
    <FormProvider {...methods}>
      <VirtualBenefitContext.Provider value={contextValue}>
        {children}
      </VirtualBenefitContext.Provider>
    </FormProvider>
  );
};

export default VirtualBenefitFormProvider;
