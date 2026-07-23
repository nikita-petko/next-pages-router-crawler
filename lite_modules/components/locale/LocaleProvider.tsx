import { RobloxLocaleApiUserLocalizationLocusLocalesResponse as SupportedLocalesResponse } from '@rbx/client-locale/v1';
import { memo, ReactNode, useCallback, useRef, useState } from 'react';

import LocaleClient from '@clients/locale';
import { LocaleProviderContext } from '@constants/localization';

type LocaleProviderProps = {
  children: ReactNode;
};

const LocaleProvider = memo(({ children }: LocaleProviderProps) => {
  const [supportedLocales, setSupportedLocales] = useState<SupportedLocalesResponse | null>(null);
  const pendingRequest = useRef<Promise<SupportedLocalesResponse> | null>(null);

  const getSupportedLocales = useCallback(async (): Promise<SupportedLocalesResponse> => {
    if (supportedLocales !== null) {
      return supportedLocales;
    }

    if (!pendingRequest.current) {
      pendingRequest.current = LocaleClient.getUserLocalizationLocusSupportedLocales();
    }

    const locales = await pendingRequest.current;
    setSupportedLocales(locales);
    pendingRequest.current = null;
    return locales;
  }, [supportedLocales]);

  return (
    <LocaleProviderContext.Provider value={{ getSupportedLocales }}>
      {children}
    </LocaleProviderContext.Provider>
  );
});

export default LocaleProvider;
