import { Locale, useLocalization } from '@rbx/intl';

const useLocale = () => {
  return useLocalization().locale ?? Locale.English;
};
export default useLocale;
