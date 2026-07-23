import { useContext } from 'react';
import EntryManagementMetadataContext from '../providers/EntryManagementMetadataContext';

export default function useEntryManagementMetadata() {
  return useContext(EntryManagementMetadataContext);
}
