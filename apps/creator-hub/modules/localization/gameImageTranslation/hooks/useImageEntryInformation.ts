import { useContext } from 'react';
import ImageLocalizationTableEntriesContext from '../providers/ImageLocalizationTableEntriesContext';

/** Image analogue to strings' useEntryInformation; reads the asset-entries fetching context. */
export default function useImageEntryInformation() {
  return useContext(ImageLocalizationTableEntriesContext);
}
