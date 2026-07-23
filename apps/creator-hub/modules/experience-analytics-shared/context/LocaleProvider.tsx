import type { FunctionComponent } from 'react';
import React, { useContext, createContext, useMemo } from 'react';
import { Locale } from '@rbx/intl';
import useLocale from '@modules/charts-generic/context/useLocale';

type LocaleBundle = {
  locale: Locale;
};
const LocaleContext = createContext<LocaleBundle>({
  locale: Locale.English,
});
LocaleContext.displayName = 'LocaleContext';
export const useLocaleFromContext = (): LocaleBundle => {
  return useContext(LocaleContext);
};
export const LocaleProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const locale = useLocale();
  const context = useMemo(() => {
    return { locale };
  }, [locale]);
  return <LocaleContext.Provider value={context}>{children}</LocaleContext.Provider>;
};
