import {
  Locale,
  LocalizationProvider,
  NativeName,
  useLocalization,
  withTranslation,
} from '@rbx/intl';
import { memo, ReactNode, useEffect, useMemo } from 'react';

import { unifiedLoggerMetadata } from '@clients/unifiedLogger';
import TranslationResourceProvider from '@components/locale/TranslationResourceProvider';
import { TranslationNamespace } from '@constants/localization';
import useZodLocale from '@hooks/useZodLocale';

interface TranslationLocalizationProviderProps {
  children: ReactNode;
}

const WithTranslationWrapper = withTranslation(({ children }: { children: ReactNode }) => {
  const { locale } = useLocalization();
  useZodLocale();

  useEffect(() => {
    unifiedLoggerMetadata.setLocalizationContext(locale ?? '');
  }, [locale]);

  return <>{children}</>;
}, Object.values(TranslationNamespace));

const TranslationLocalizationProvider = memo(
  ({ children }: TranslationLocalizationProviderProps) => {
    const translationResourceProvider = useMemo(
      () =>
        new TranslationResourceProvider({ locale: Locale.English, nativeName: NativeName.English }),
      [],
    );

    return (
      <LocalizationProvider provider={translationResourceProvider}>
        <WithTranslationWrapper>{children}</WithTranslationWrapper>
      </LocalizationProvider>
    );
  },
);

export default TranslationLocalizationProvider;
