import { useContext } from 'react';
import TranslationLogicContext from '../providers/TranslationLogicContext';

export default function useTranslationLogic() {
  return useContext(TranslationLogicContext);
}
