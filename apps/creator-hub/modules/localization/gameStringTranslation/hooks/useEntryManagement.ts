import { useContext } from 'react';
import EntriesMetadataContext from '../providers/EntriesMetadataContext';

export default function useEntryManagement() {
  return useContext(EntriesMetadataContext);
}
