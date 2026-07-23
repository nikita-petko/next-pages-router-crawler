import { useContext, useMemo } from 'react';
import LocalizationContext from '../LocalizationContext';
import LocaleInfo from '../interfaces/LocaleInfo';

type LocaleInfoSetter = {
  setLocaleInfo: (_: LocaleInfo) => void;
};
type DefaultLocaleInfo = {
  [key in keyof LocaleInfo]: null;
};
type UseLocalizationReturnType = (LocaleInfo | DefaultLocaleInfo) & LocaleInfoSetter;

function useLocalization(): UseLocalizationReturnType {
  const localization = useContext(LocalizationContext);

  const memorizedLocaleInfo = useMemo(() => {
    if (typeof localization !== 'undefined') {
      const {
        localeInfo: { locale, nativeName },
        setLocaleInfo,
      } = localization;

      return {
        locale,
        nativeName,
        setLocaleInfo,
      };
    }

    return {
      locale: null,
      nativeName: null,
      // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
      setLocaleInfo: (_: LocaleInfo) => {},
    };
  }, [localization]);

  if (typeof localization === 'undefined') {
    // eslint-disable-next-line no-console
    console.warn(
      'Localization context is missing, useLocalization cannot work outside of the LocalizationProvider'
    );
  }

  return memorizedLocaleInfo;
}

export default useLocalization;
