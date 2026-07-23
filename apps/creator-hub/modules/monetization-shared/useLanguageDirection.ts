import useLanguageManagement from '@modules/localization/localization/hooks/useLanguageManagement';
import { rtlLanguages } from '@modules/localization/translation/constants';

export function useLanguageDirection() {
  const { sourceLanguageCode } = useLanguageManagement();
  if (!sourceLanguageCode) {
    return undefined; // fallback to default
  }
  return rtlLanguages.has(sourceLanguageCode) ? 'rtl' : 'ltr';
}

export default useLanguageDirection;
