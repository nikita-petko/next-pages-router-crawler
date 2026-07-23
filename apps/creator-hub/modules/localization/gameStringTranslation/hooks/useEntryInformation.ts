import { useContext } from 'react';
import LocalizationTableEntriesContext from '../providers/LocalizationTableEntriesContext';

export default function useEntryInformation() {
  return useContext(LocalizationTableEntriesContext);
}
