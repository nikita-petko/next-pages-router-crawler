import { createContext } from 'react';
import type { LanguageBriefInfo, LanguageDetailedInfo } from '../types/LanguageInfo';
import type { LocaleBriefInfo } from '../types/LocaleInfo';

export interface LanguageManagementValue {
  allLanguagesBriefInfoList: LanguageBriefInfo[];
  supportedLanguagesBriefInfoList: LanguageBriefInfo[];
  eligibleLanguagesBriefInfoList: LanguageBriefInfo[];
  supportedLanguagesDetailedInfoList: LanguageDetailedInfo[] | null;
  supportedLocalesBriefInfoList: LocaleBriefInfo[] | null;
  sourceLanguageCode: string | null;
  isLanguageCodeValid: (languageCode: string) => boolean;
  handleAddLanguage: (languageCodes: string[]) => void;
  handleSwitchAutoTranslation: (languageCode: string, autoTranslationEnabled: boolean) => void;
  handleSwitchInformationAutoTranslation: (languageCode: string, enabled: boolean) => void;
  handleSwitchImageAutoTranslation: (languageCode: string, enabled: boolean) => void;
  handleDeleteLanguage: (languageCode: string) => void;
  handleChangeSourceLanguage: (languageCode: string) => Promise<void>;
  fetchSupportedLanguagesError: Error | null;
  isLoadingSourceLanguage: boolean;
  isLoadingSupportedLanguages: boolean;
  fetchSourceLanguageError: Error | null;
  langCodeListInInfoATUpdate: string[];
  langCodeListInATUpdate: string[];
  langCodeListInImageATUpdate: string[];
}

const languageManagementContext = createContext<LanguageManagementValue>({
  allLanguagesBriefInfoList: [],
  supportedLanguagesBriefInfoList: [],
  supportedLocalesBriefInfoList: [],
  eligibleLanguagesBriefInfoList: [],
  supportedLanguagesDetailedInfoList: null,
  sourceLanguageCode: null,
  isLanguageCodeValid: () => false,
  handleAddLanguage: () => {},
  handleSwitchAutoTranslation: () => {},
  handleSwitchInformationAutoTranslation: () => {},
  handleSwitchImageAutoTranslation: () => {},
  handleDeleteLanguage: () => {},
  handleChangeSourceLanguage: async () => {},
  fetchSupportedLanguagesError: null,
  isLoadingSourceLanguage: false,
  isLoadingSupportedLanguages: false,
  fetchSourceLanguageError: null,
  langCodeListInInfoATUpdate: [],
  langCodeListInATUpdate: [],
  langCodeListInImageATUpdate: [],
});

export default languageManagementContext;
