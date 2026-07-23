import { useContext } from 'react';
import LanguageManagementContext from '../providers/LanguageManagementContext';

export default function useTranslationLogic() {
  return useContext(LanguageManagementContext);
}
