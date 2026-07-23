import type { FunctionComponent } from 'react';
import React, { useContext, createContext } from 'react';
import { useLocaleMapGivenCurrentLanguage } from '@modules/localization/localization/hooks/useLocaleMap';
import { useLocaleFromContext } from './LocaleProvider';

type LocaleMapBundle = {
  languagesMap: Map<string, string>;
  localesMap: Map<string, string>;
};
export const LocaleMapContext = createContext<LocaleMapBundle>({
  languagesMap: new Map(),
  localesMap: new Map(),
});
LocaleMapContext.displayName = 'LocaleMapContext';
export const useLocaleMapFromContext = (): LocaleMapBundle => {
  return useContext(LocaleMapContext);
};
export const LocaleMapProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const { locale } = useLocaleFromContext();
  const localeInfo = useLocaleMapGivenCurrentLanguage(locale);
  return <LocaleMapContext.Provider value={localeInfo}>{children}</LocaleMapContext.Provider>;
};
