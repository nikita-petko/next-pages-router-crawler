import { ItemTargetType } from '@rbx/client-marketplace-items-api/v1';
import type { UseTranslationWithNamespaceResult } from '@rbx/intl';
import type { TPendingTranslationFunction } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { CollectibleMatchItemDetails } from '../hooks/useCollectibleMatchItemDetails';

type TranslateCreations =
  UseTranslationWithNamespaceResult<TranslationNamespace.Creations>['translate'];

const CREATIONS_SUBTYPE_TRANSLATION_KEYS: Readonly<
  Record<string, Parameters<TranslateCreations>[0]>
> = {
  EmoteAnimation: 'Label.Emote',
  Body: 'Label.Body',
  Shoes: 'Label.Shoes',
  AvatarAnimations: 'Label.AvatarAnimations',
};

const CREATIONS_CATEGORY_TRANSLATION_KEYS: Readonly<
  Record<string, Parameters<TranslateCreations>[0]>
> = {
  HairAccessory: 'Label.Body',
  Hat: 'Label.Accessory',
  FaceAccessory: 'Label.Accessory',
  NeckAccessory: 'Label.Accessory',
  ShoulderAccessory: 'Label.Accessory',
  FrontAccessory: 'Label.Accessory',
  BackAccessory: 'Label.Accessory',
  WaistAccessory: 'Label.Accessory',
  TShirtAccessory: 'Label.Clothing',
  ShirtAccessory: 'Label.Clothing',
  PantsAccessory: 'Label.Clothing',
  JacketAccessory: 'Label.Clothing',
  SweaterAccessory: 'Label.Clothing',
  ShortsAccessory: 'Label.Clothing',
  DressSkirtAccessory: 'Label.Clothing',
  EyebrowAccessory: 'Label.Makeup',
  EyelashAccessory: 'Label.Makeup',
};

const getPendingSubtypeLabel = (
  subtype: string,
  tPendingTranslation: TPendingTranslationFunction,
): string | undefined => {
  switch (subtype) {
    case 'TShirt':
    case 'TShirtAccessory':
      return tPendingTranslation(
        'T-Shirt',
        'Subtype label',
        translationKey('Label.TShirt', TranslationNamespace.Creations),
      );
    case 'Hat':
      return tPendingTranslation(
        'Hat',
        'Subtype label',
        translationKey('Label.Hat', TranslationNamespace.Creations),
      );
    case 'Shirt':
    case 'ShirtAccessory':
      return tPendingTranslation(
        'Shirt',
        'Subtype label',
        translationKey('Label.Shirt', TranslationNamespace.Creations),
      );
    case 'Pants':
    case 'PantsAccessory':
      return tPendingTranslation(
        'Pants',
        'Subtype label',
        translationKey('Label.Pants', TranslationNamespace.Creations),
      );
    case 'HairAccessory':
      return tPendingTranslation(
        'Hair',
        'Subtype label',
        translationKey('Label.Hair', TranslationNamespace.Creations),
      );
    case 'FaceAccessory':
      return tPendingTranslation(
        'Face',
        'Subtype label',
        translationKey('Label.Face', TranslationNamespace.Creations),
      );
    case 'NeckAccessory':
      return tPendingTranslation(
        'Neck',
        'Subtype label',
        translationKey('Label.Neck', TranslationNamespace.Creations),
      );
    case 'ShoulderAccessory':
      return tPendingTranslation(
        'Shoulder',
        'Subtype label',
        translationKey('Label.Shoulder', TranslationNamespace.Creations),
      );
    case 'FrontAccessory':
      return tPendingTranslation(
        'Front',
        'Subtype label',
        translationKey('Label.Front', TranslationNamespace.Creations),
      );
    case 'BackAccessory':
      return tPendingTranslation(
        'Back',
        'Subtype label',
        translationKey('Label.Back', TranslationNamespace.Creations),
      );
    case 'WaistAccessory':
      return tPendingTranslation(
        'Waist',
        'Subtype label',
        translationKey('Label.Waist', TranslationNamespace.Creations),
      );
    case 'JacketAccessory':
      return tPendingTranslation(
        'Jacket',
        'Subtype label',
        translationKey('Label.Jacket', TranslationNamespace.Creations),
      );
    case 'SweaterAccessory':
      return tPendingTranslation(
        'Sweater',
        'Subtype label',
        translationKey('Label.Sweater', TranslationNamespace.Creations),
      );
    case 'ShortsAccessory':
      return tPendingTranslation(
        'Shorts',
        'Subtype label',
        translationKey('Label.Shorts', TranslationNamespace.Creations),
      );
    case 'DressSkirtAccessory':
      return tPendingTranslation(
        'Dress Skirt',
        'Subtype label',
        translationKey('Label.DressSkirt', TranslationNamespace.Creations),
      );
    case 'EyebrowAccessory':
      return tPendingTranslation(
        'Eyebrow',
        'Subtype label',
        translationKey('Label.Eyebrow', TranslationNamespace.Creations),
      );
    case 'EyelashAccessory':
      return tPendingTranslation(
        'Eyelash',
        'Subtype label',
        translationKey('Label.Eyelash', TranslationNamespace.Creations),
      );
    case 'FaceMakeup':
      return tPendingTranslation(
        'Face Makeup',
        'Subtype label',
        translationKey('Label.FaceMakeup', TranslationNamespace.Creations),
      );
    case 'LipMakeup':
      return tPendingTranslation(
        'Lip Makeup',
        'Subtype label',
        translationKey('Label.LipMakeup', TranslationNamespace.Creations),
      );
    case 'EyeMakeup':
      return tPendingTranslation(
        'Eye Makeup',
        'Subtype label',
        translationKey('Label.EyeMakeup', TranslationNamespace.Creations),
      );
    case 'DynamicHead':
      return tPendingTranslation(
        'Dynamic Head',
        'Subtype label',
        translationKey('Label.DynamicHead', TranslationNamespace.Creations),
      );
    default:
      return undefined;
  }
};

const formatSubtype = (subtype: string): string => subtype.replaceAll(/([a-z])([A-Z])/g, '$1 $2');

const getSubtypeLabel = (
  subtype: string,
  translateCreations: TranslateCreations,
  tPendingTranslation: TPendingTranslationFunction,
): string => {
  const existingTranslationKey = CREATIONS_SUBTYPE_TRANSLATION_KEYS[subtype];
  if (existingTranslationKey) {
    return translateCreations(existingTranslationKey);
  }

  const pendingSubtypeLabel = getPendingSubtypeLabel(subtype, tPendingTranslation);
  if (pendingSubtypeLabel !== undefined) {
    return pendingSubtypeLabel;
  }

  return tPendingTranslation(
    '{subtype}',
    'Fallback subtype label where subtype is passed in',
    translationKey('Label.SubtypeFallback', TranslationNamespace.Creations),
    { subtype: formatSubtype(subtype) },
  );
};

const getCollectibleItemTypeLabel = (
  details: CollectibleMatchItemDetails,
  translateCreations: TranslateCreations,
  tPendingTranslation: TPendingTranslationFunction,
): string => {
  const { collectible, subtype } = details;
  if (
    collectible.itemTargetType !== ItemTargetType.NUMBER_1 &&
    collectible.itemTargetType !== ItemTargetType.NUMBER_2
  ) {
    return '-';
  }

  if (!subtype || subtype === 'Invalid') {
    return collectible.itemTargetType === ItemTargetType.NUMBER_2
      ? translateCreations('Label.Bundle')
      : translateCreations('Label.Asset');
  }

  const subtypeLabel = getSubtypeLabel(subtype, translateCreations, tPendingTranslation);
  const categoryTranslationKey = CREATIONS_CATEGORY_TRANSLATION_KEYS[subtype];
  if (collectible.itemTargetType === ItemTargetType.NUMBER_1 && categoryTranslationKey) {
    return tPendingTranslation(
      '{category} > {subtype}',
      'Type hierarchy label for an avatar item',
      translationKey('Label.CollectibleAccessoryType', TranslationNamespace.Creations),
      {
        category: translateCreations(categoryTranslationKey),
        subtype: subtypeLabel,
      },
    );
  }

  return subtypeLabel;
};

export default getCollectibleItemTypeLabel;
