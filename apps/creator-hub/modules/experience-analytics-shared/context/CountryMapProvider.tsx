import type { FunctionComponent } from 'react';
import React, { useContext, createContext, useMemo } from 'react';
import useCountryMapGivenLocale from '../hooks/useCountryMapGivenLocale';
import { useLocaleFromContext } from './LocaleProvider';

type CountryMapBundle = {
  countryNamesMap: Map<string, string>;
};
export const CountryMapContext = createContext<CountryMapBundle>({
  countryNamesMap: new Map(),
});
CountryMapContext.displayName = 'CountryMapContext';
export const useCountryMapFromContext = (): CountryMapBundle => {
  return useContext(CountryMapContext);
};
export const CountryMapProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const { locale } = useLocaleFromContext();
  const countryNamesMap = useCountryMapGivenLocale(locale);
  const context = useMemo(() => {
    return { countryNamesMap };
  }, [countryNamesMap]);
  return <CountryMapContext.Provider value={context}>{children}</CountryMapContext.Provider>;
};
