import { useContext } from 'react';

import { LocaleProviderContext } from '@constants/localization';

export const useGetSupportedLocales = () => {
  const context = useContext(LocaleProviderContext);
  if (context === null) {
    throw new Error('useGetSupportedLocales must be used within a LocaleProvider');
  }

  return context?.getSupportedLocales;
};
