import React, { FunctionComponent, useCallback, useMemo } from 'react';
import TranslationResource from '../interfaces/TranslationResource';
import LocalizationContext, { LocalizationType } from '../LocalizationContext';
import TranslationResourceContext, { TranslationResourceType } from '../TranslationResourceContext';
import LocaleInfo from '../interfaces/LocaleInfo';

export interface StaticTranslationProviderProps {
  resourceKey?: string;
  localeInfo: LocaleInfo;
  resources: TranslationResource[];
}

const StaticTranslationProvider: FunctionComponent<
  React.PropsWithChildren<StaticTranslationProviderProps>
> = ({ resourceKey, localeInfo, resources, children }) => {
  // locale context
  const setLocaleInfo = useCallback(() => {
    // eslint-disable-next-line no-console
    console.warn('setLocale is not supported under StaticTranslationProvider.');
  }, []);

  const localizationContextValue = useMemo<LocalizationType>(
    () => ({ ready: true, localeInfo, setLocaleInfo }),
    [localeInfo, setLocaleInfo]
  );

  // translation resource content
  const translationResourceContextValue = useMemo<TranslationResourceType>(
    () => ({ key: resourceKey, ready: true, resources: Object.assign({}, ...resources) }),
    [resourceKey, resources]
  );

  return (
    <LocalizationContext.Provider value={localizationContextValue}>
      <TranslationResourceContext.Provider value={translationResourceContextValue}>
        {children}
      </TranslationResourceContext.Provider>
    </LocalizationContext.Provider>
  );
};

export default StaticTranslationProvider;
