import { createContext } from 'react';
import type { UserRoleType } from '@modules/clients/translationRoles';
import type { TranslationLanguage } from '../types/TranslationLanguage';
import type TranslationTarget from '../types/TranslationTarget';

export interface TranslationLogicValue {
  userRoles: Array<UserRoleType>;
  roleLoading: boolean;
  sourceTranslationLanguage: TranslationLanguage | null;
  activeTranslationTarget: TranslationTarget | null;
  setActiveTranslationTarget: (translationTarget: TranslationTarget) => void;
  supportedLanguageLoading: boolean;
  supportedLanguages: Array<TranslationLanguage>;
  sourceLanguageCodeLoading: boolean;
  sourceLanguageCode: string | null;
  defaultSourceLocaleCode: string | null;
  setSupportedLanguages: (languages: Array<TranslationLanguage>) => void;
}

const translationLogicContext = createContext<TranslationLogicValue>({
  userRoles: [],
  roleLoading: false,
  sourceTranslationLanguage: null,
  activeTranslationTarget: null,
  setActiveTranslationTarget: () => ({}),
  supportedLanguageLoading: false,
  supportedLanguages: [],
  sourceLanguageCodeLoading: false,
  sourceLanguageCode: null,
  defaultSourceLocaleCode: null,
  setSupportedLanguages: () => ({}),
});
translationLogicContext.displayName = 'translation';

export default translationLogicContext;
