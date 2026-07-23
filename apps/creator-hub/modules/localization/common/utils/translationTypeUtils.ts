import { RobloxGameInternationalizationApiGetNameDescriptionHistoryV2RequestContentTypeEnum as TranslationProductType } from '@rbx/clients/gameinternationalization/v1';
import type { GameInfoTranslationInfo } from '../../gameInfoTranslation/types';
import GameInfoField from '../../gameInfoTranslation/enums/GameInfoField';
import ProductFieldType from '../../gameProductTranslation/enums/ProductFieldTypes';
import ProductType from '../../gameProductTranslation/enums/ProductTypes';
import type { GameProductTranslationInfo } from '../../gameProductTranslation/types';

export const getProductTranslationType = (
  productInfo: GameProductTranslationInfo,
): TranslationProductType => {
  let translationProductType: TranslationProductType;
  switch (productInfo.productType) {
    case ProductType.Badge:
      if (productInfo.fieldType === ProductFieldType.Name) {
        translationProductType = TranslationProductType.BadgeDisplayName;
      } else {
        translationProductType = TranslationProductType.BadgeDisplayDescription;
      }
      break;
    case ProductType.Pass:
      if (productInfo.fieldType === ProductFieldType.Name) {
        translationProductType = TranslationProductType.GamePassDisplayName;
      } else {
        translationProductType = TranslationProductType.GamePassDisplayDescription;
      }
      break;
    case ProductType.DeveloperProduct:
      if (productInfo.fieldType === ProductFieldType.Name) {
        translationProductType = TranslationProductType.DeveloperProductDisplayName;
      } else {
        translationProductType = TranslationProductType.DeveloperProductDisplayDescription;
      }
      break;
    default:
      throw new Error(`Invalid product type.`);
  }
  return translationProductType;
};

export const getUniverseTranslationType = (
  universeInfo: GameInfoTranslationInfo,
): TranslationProductType => {
  if (universeInfo.fieldType === GameInfoField.Name) {
    return TranslationProductType.UniverseDisplayNames;
  }
  return TranslationProductType.UniverseDisplayDescriptions;
};
