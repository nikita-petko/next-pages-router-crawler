import { useContext } from 'react';
import TranslatorManagementContext from '../providers/TranslatorManagementContext';

export default function useTranslationLogic() {
  return useContext(TranslatorManagementContext);
}
