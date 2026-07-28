import { useState, useMemo } from 'react';
import type { UseFormProps } from 'react-hook-form';
import { useForm, FormProvider } from 'react-hook-form';
import { FormMode } from '@modules/miscellaneous/common';
import type { ErrorStates, VirtualBenefitFormType } from './types';
import VirtualBenefitContext from './VirtualBenefitContext';

type VirtualBenefitFormProviderProps = UseFormProps<VirtualBenefitFormType>;

const VirtualBenefitFormProvider = ({
  children,
  ...props
}: React.PropsWithChildren<VirtualBenefitFormProviderProps>) => {
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
