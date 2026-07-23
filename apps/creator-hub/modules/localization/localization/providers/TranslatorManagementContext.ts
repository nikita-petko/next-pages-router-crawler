import { TranslatorType } from '@modules/clients';
import { createContext } from 'react';
import { TranslatorAssigneeData } from '../types/TranslatorInfo';

export interface TranslatorManagementValue {
  isTranslatorListLoading: boolean;
  isTranslatorListFetchFailed: boolean;
  translatorData: TranslatorAssigneeData[] | null;
  translatorIdInDeletion: number | null;
  deleteTranslator: (translator: TranslatorAssigneeData) => Promise<void>;
  isAddingTranslator: boolean;
  addTranslators: (translatorIds: number[], translatorType: TranslatorType) => Promise<void>;
}

const translatorManagementContext = createContext<TranslatorManagementValue>({
  isTranslatorListLoading: false,
  isTranslatorListFetchFailed: false,
  translatorData: null,
  translatorIdInDeletion: null,
  deleteTranslator: () => Promise.reject(new Error('deleteTranslator not implemented')),
  isAddingTranslator: false,
  addTranslators: () => Promise.reject(new Error('addTranslators not implemented')),
});

export default translatorManagementContext;
