import { useContext } from 'react';
import ImageEntriesMetadataContext from '../providers/ImageEntriesMetadataContext';

export default function useImageEntryManagement() {
  return useContext(ImageEntriesMetadataContext);
}
