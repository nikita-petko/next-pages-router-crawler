import { createContext } from 'react';
import type { ImageTranslationInfo, ImageEntryBriefInfo } from '../types';

export interface ImageEntriesMetadataValue {
  fullEntryList: ImageEntryBriefInfo[];
  fullEntryInfoMap: Map<string, ImageTranslationInfo>;
}

const ImageEntriesMetadataContext = createContext<ImageEntriesMetadataValue>({
  fullEntryInfoMap: new Map(),
  fullEntryList: [],
});

ImageEntriesMetadataContext.displayName = 'ImageEntriesMetadata';

export default ImageEntriesMetadataContext;
