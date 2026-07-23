import type {
  BadgeIconResponse,
  DeveloperProductIconResponse,
  GamePassIconResponse,
} from '@modules/clients/gameInternationalization';
import type { ImageTranslation } from '../types';
import { getImageStatus } from './productItemUtils';

function iconResponseToMap(
  response: GamePassIconResponse | BadgeIconResponse | DeveloperProductIconResponse,
): Map<string, ImageTranslation> {
  const imageTranslationMap = new Map<string, ImageTranslation>();
  if (!response || !response.data) {
    return imageTranslationMap;
  }
  response.data.forEach((item) => {
    const imageStatus = getImageStatus(item.state);
    if (imageStatus === null) {
      throw new Error(`ProductListItem: unexpected ImageStatus=${item.state}`);
    }
    imageTranslationMap.set(item.languageCode, {
      imageUrl: item.imageUrl,
      imageStatus,
      languageCode: item.languageCode,
    });
  });
  return imageTranslationMap;
}

export default iconResponseToMap;
