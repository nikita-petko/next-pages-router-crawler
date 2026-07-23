import { TranslationEntryTable } from '@modules/clients';
import { createContext } from 'react';
import {
  EntryBriefInfo,
  GameStringTranslationInfo,
  TranslationInfo,
  TranslationEntry,
} from '../types';

export interface EntriesMetadataValue {
  modifyEntry: (entryKey: string, translation: TranslationInfo) => void;
  addEntry: (translationEntry: TranslationEntry) => void;
  deleteEntry: (entryInfo: GameStringTranslationInfo) => void;
  fullEntryTable: TranslationEntryTable;
  fullEntryList: EntryBriefInfo[];
  fullEntryKeySet: Set<string>;
  fullEntryInfoMap: Map<string, GameStringTranslationInfo>;
  doesTranslationFeedbackExist: boolean;
}

const EntriesMetadataContext = createContext<EntriesMetadataValue>({
  modifyEntry: () => undefined,
  addEntry: () => undefined,
  deleteEntry: () => undefined,
  fullEntryTable: [],
  fullEntryKeySet: new Set(),
  fullEntryInfoMap: new Map(),
  fullEntryList: [],
  doesTranslationFeedbackExist: false,
});
EntriesMetadataContext.displayName = 'EntriesMetadata';

export default EntriesMetadataContext;
