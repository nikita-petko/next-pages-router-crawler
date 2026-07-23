import React, { FunctionComponent } from 'react';
import { SnackbarProvider } from '@rbx/ui';
import TranslationContainer from './TranslationContainer';

const TranslationMetadataContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <SnackbarProvider>
      <TranslationContainer />
    </SnackbarProvider>
  );
};

export default TranslationMetadataContainer;
