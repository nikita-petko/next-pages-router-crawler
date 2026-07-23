import React, { FunctionComponent, useContext, createContext, useMemo } from 'react';
import { useLocaleFromContext } from './LocaleProvider';
import useCountryMapGivenLocale from '../hooks/useCountryMapGivenLocale';

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
