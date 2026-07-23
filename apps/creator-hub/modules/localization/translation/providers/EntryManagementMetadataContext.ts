import { createContext } from 'react';
import { TranslationLanguage } from '../types/TranslationLanguage';
import TranslationTarget from '../types/TranslationTarget';

export interface EntryManagementMetadataValue {
  gameId: number | null;
  currentLanguageOrLocaleCode: string | null;
  entryTableId: string;
  fetchEntryTableIdError: Error | null;
  sourceLanguageCode: string;
  activeTranslationTarget: TranslationTarget | null;
  supportedLanguages: TranslationLanguage[];
  isRoleAdmin: boolean;
  tableIdLoading: boolean;
  shouldLoadTranslationHistory: boolean;
}

const EntryManagementMetadataContext = createContext<EntryManagementMetadataValue>({
  gameId: null,
  currentLanguageOrLocaleCode: null,
  entryTableId: '',
  fetchEntryTableIdError: null,
  sourceLanguageCode: 'en',
  activeTranslationTarget: null,
  supportedLanguages: [],
  isRoleAdmin: false,
  tableIdLoading: false,
  shouldLoadTranslationHistory: false,
});
EntryManagementMetadataContext.displayName = 'entryManagementMetadata';

export default EntryManagementMetadataContext;
