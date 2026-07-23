import type { FunctionComponent } from 'react';
import React from 'react';
import { SnackbarProvider } from '@rbx/ui';
import TranslationContainer from './TranslationContainer';

const TranslationMetadataContainer: FunctionComponent<React.PropsWithChildren> = () => {
  return (
    <SnackbarProvider>
      <TranslationContainer />
    </SnackbarProvider>
  );
};

export default TranslationMetadataContainer;
